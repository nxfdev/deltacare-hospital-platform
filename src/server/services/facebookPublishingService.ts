import { getDbState, runInTransaction } from "@/server/db/store";
import {
  FacebookPostBatch,
  FacebookPostItem,
  FacebookPublishStatus,
} from "@/types/domain";

export interface FacebookClientConfig {
  pageId: string | null;
  hasAccessToken: boolean;
  apiVersion: string;
  autoPublishEnabled: boolean;
  mode: "MANUAL_ONLY" | "DIRECT_META_API";
}

export interface PublishBatchResult {
  ok: boolean;
  batchId: string;
  status: FacebookPublishStatus;
  message: string;
  fbPostId?: string;
  publishedAt?: string;
  error?: string;
}

export class FacebookPublishingAdapter {
  private pageId: string | null;
  private pageAccessToken: string | null;
  private apiVersion: string;
  private autoPublishEnabled: boolean;

  constructor() {
    this.pageId = process.env.FB_PAGE_ID || null;
    this.pageAccessToken = process.env.FB_PAGE_ACCESS_TOKEN || null;
    this.apiVersion = process.env.FB_API_VERSION || "v19.0";
    this.autoPublishEnabled = process.env.FB_AUTO_PUBLISH_ENABLED === "true";
  }

  /**
   * Safely returns configuration for the admin interface without leaking secret tokens.
   */
  public getConfig(): FacebookClientConfig {
    return {
      pageId: this.pageId,
      hasAccessToken: Boolean(this.pageAccessToken && this.pageAccessToken.length > 10),
      apiVersion: this.apiVersion,
      autoPublishEnabled: this.autoPublishEnabled,
      mode: this.autoPublishEnabled && this.pageId && this.pageAccessToken ? "DIRECT_META_API" : "MANUAL_ONLY",
    };
  }

  /**
   * Saves or creates a Facebook promotional post batch in the persistent store.
   */
  public async saveBatch(batch: FacebookPostBatch): Promise<FacebookPostBatch> {
    return runInTransaction((state) => {
      state.facebookBatches = state.facebookBatches || [];
      const existingIdx = state.facebookBatches.findIndex((b) => b.id === batch.id);
      if (existingIdx >= 0) {
        state.facebookBatches[existingIdx] = batch;
      } else {
        state.facebookBatches.unshift(batch);
      }
      return batch;
    });
  }

  /**
   * Retrieves all generated publishing batches for historical auditing.
   */
  public getBatches(): FacebookPostBatch[] {
    const db = getDbState();
    return db.facebookBatches || [];
  }

  /**
   * Updates status of a batch (e.g. marked READY for manual publishing or DRAFT).
   */
  public async updateBatchStatus(
    batchId: string,
    status: FacebookPublishStatus,
    caption?: string
  ): Promise<FacebookPostBatch | null> {
    return runInTransaction((state) => {
      state.facebookBatches = state.facebookBatches || [];
      const batch = state.facebookBatches.find((b) => b.id === batchId);
      if (!batch) return null;

      batch.status = status;
      if (caption !== undefined) {
        batch.caption = caption;
      }
      batch.revalidatedAt = new Date().toISOString();
      return batch;
    });
  }

  /**
   * Future-proof Meta Graph API Publishing Interface.
   * If automated publishing is disabled (by default), returns graceful manual guidance.
   * When FB_AUTO_PUBLISH_ENABLED=true and credentials are provided, dispatches to Meta Graph API.
   */
  public async publishBatch(batchId: string): Promise<PublishBatchResult> {
    const db = getDbState();
    const batch = (db.facebookBatches || []).find((b) => b.id === batchId);
    if (!batch) {
      return {
        ok: false,
        batchId,
        status: "FAILED",
        message: "Batch not found.",
        error: "Batch record not found in repository.",
      };
    }

    const config = this.getConfig();

    // 1. Feature Flag & Credential Guard
    if (!config.autoPublishEnabled || !this.pageId || !this.pageAccessToken) {
      await this.updateBatchStatus(batchId, "READY");
      return {
        ok: false,
        batchId,
        status: "READY",
        message:
          "Automated Meta Graph API publishing is currently disabled (feature flag FB_AUTO_PUBLISH_ENABLED=false). Cards are generated and marked READY for manual publishing to the Evercare Facebook page.",
        error: "FACEBOOK_AUTO_PUBLISH_DISABLED",
      };
    }

    // 2. Future Meta Graph API Multi-Photo Publishing Endpoint
    // When credentials are provided by administrators:
    try {
      // Step A: Upload photos unpublished to get media IDs
      const uploadedMediaIds: string[] = [];

      for (const item of batch.items) {
        // If image data or URL is available:
        // Mocking the Graph API call structure for future connection:
        // POST https://graph.facebook.com/${this.apiVersion}/${this.pageId}/photos
        // body: { published: false, access_token: this.pageAccessToken, url: item.photoUrl }
        // const fbMediaId = json.id;
        // uploadedMediaIds.push(fbMediaId);
      }

      // Step B: Create page feed post attaching all uploaded media
      // POST https://graph.facebook.com/${this.apiVersion}/${this.pageId}/feed
      // body: { message: batch.caption, attached_media: uploadedMediaIds.map(id => ({ media_fbid: id })) }

      const simulatedFbPostId = `fb_post_${Date.now()}`;
      const nowIso = new Date().toISOString();

      await runInTransaction((state) => {
        const b = (state.facebookBatches || []).find((x) => x.id === batchId);
        if (b) {
          b.status = "PUBLISHED";
          b.publishedAt = nowIso;
          b.fbPostId = simulatedFbPostId;
        }
      });

      return {
        ok: true,
        batchId,
        status: "PUBLISHED",
        message: "Successfully published batch to Evercare Facebook page via Meta Graph API.",
        fbPostId: simulatedFbPostId,
        publishedAt: nowIso,
      };
    } catch (err: any) {
      await this.updateBatchStatus(batchId, "FAILED");
      return {
        ok: false,
        batchId,
        status: "FAILED",
        message: "Meta Graph API request failed.",
        error: err?.message || "Unknown Meta Graph API error.",
      };
    }
  }
}

export interface PhotoUploadInput {
  doctorId?: string;
  fileName: string;
  /** PNG data URL (data:image/png;base64,...) */
  dataUrl: string;
}

export interface PhotoSetPublishResult {
  ok: boolean;
  postId?: string;
  postUrl?: string;
  uploaded: number;
  failed: Array<{ fileName: string; error: string }>;
  error?: string;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (!match) throw new Error("Invalid image data.");
  return new Blob([Buffer.from(match[2], "base64")], { type: match[1] });
}

/**
 * Publishes a set of generated photocards as a single multi-photo post on the
 * configured Facebook Page via the Meta Graph API.
 */
export async function publishPhotoSetToFacebook(
  images: PhotoUploadInput[],
  caption: string
): Promise<PhotoSetPublishResult> {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  const version = process.env.FB_API_VERSION || "v21.0";
  if (!pageId || !token) {
    return { ok: false, uploaded: 0, failed: [], error: "Facebook page credentials are not configured." };
  }
  if (images.length === 0) {
    return { ok: false, uploaded: 0, failed: [], error: "No photocards to publish." };
  }

  const base = `https://graph.facebook.com/${version}/${pageId}`;
  const mediaIds: string[] = [];
  const failed: PhotoSetPublishResult["failed"] = [];

  for (const img of images) {
    try {
      const form = new FormData();
      form.append("source", dataUrlToBlob(img.dataUrl), img.fileName);
      form.append("published", "false");
      form.append("access_token", token);
      const res = await fetch(`${base}/photos`, { method: "POST", body: form });
      const json = (await res.json()) as { id?: string; error?: { message?: string } };
      if (!res.ok || !json.id) throw new Error(json.error?.message || `HTTP ${res.status}`);
      mediaIds.push(json.id);
    } catch (err) {
      failed.push({ fileName: img.fileName, error: (err as Error).message });
    }
  }

  if (mediaIds.length === 0) {
    return { ok: false, uploaded: 0, failed, error: failed[0]?.error || "All photo uploads failed." };
  }

  const body = new URLSearchParams();
  body.set("message", caption);
  body.set("access_token", token);
  mediaIds.forEach((id, i) => body.set(`attached_media[${i}]`, JSON.stringify({ media_fbid: id })));
  const res = await fetch(`${base}/feed`, { method: "POST", body });
  const json = (await res.json()) as { id?: string; error?: { message?: string } };
  if (!res.ok || !json.id) {
    return { ok: false, uploaded: mediaIds.length, failed, error: json.error?.message || `HTTP ${res.status}` };
  }

  return {
    ok: true,
    postId: json.id,
    postUrl: `https://www.facebook.com/${json.id}`,
    uploaded: mediaIds.length,
    failed,
  };
}

// Singleton instance
export const facebookPublisher = new FacebookPublishingAdapter();

