import { PrismaClient } from "@prisma/client";
import { createInitialSeedState } from "../src/server/db/seedData";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding DeltaCare Hospital Platform (Synthetic Development Data)...");
  const state = createInitialSeedState();

  await prisma.hospitalConfiguration.upsert({
    where: { code: state.hospital.code },
    update: {
      nameEn: state.hospital.nameEn,
      nameBn: state.hospital.nameBn,
      taglineEn: state.hospital.taglineEn,
      taglineBn: state.hospital.taglineBn,
      emergencyPhone: state.hospital.emergencyPhone,
      helplinePhone: state.hospital.helplinePhone,
      generalEmail: state.hospital.generalEmail,
    },
    create: {
      id: state.hospital.id,
      code: state.hospital.code,
      nameEn: state.hospital.nameEn,
      nameBn: state.hospital.nameBn,
      taglineEn: state.hospital.taglineEn,
      taglineBn: state.hospital.taglineBn,
      timezone: state.hospital.timezone,
      defaultLocale: state.hospital.defaultLocale,
      emergencyPhone: state.hospital.emergencyPhone,
      helplinePhone: state.hospital.helplinePhone,
      generalEmail: state.hospital.generalEmail,
      cancellationPolicyEn: state.hospital.cancellationPolicyEn,
      cancellationPolicyBn: state.hospital.cancellationPolicyBn,
      privacyNoticeEn: state.hospital.privacyNoticeEn,
      privacyNoticeBn: state.hospital.privacyNoticeBn,
      status: state.hospital.status,
    },
  });

  for (const branch of state.branches) {
    await prisma.branch.upsert({
      where: { slug: branch.slug },
      update: { nameEn: branch.nameEn, nameBn: branch.nameBn },
      create: {
        id: branch.id,
        hospitalId: branch.hospitalId,
        slug: branch.slug,
        nameEn: branch.nameEn,
        nameBn: branch.nameBn,
        subtitleEn: branch.subtitleEn,
        subtitleBn: branch.subtitleBn,
        addressEn: branch.addressEn,
        addressBn: branch.addressBn,
        cityEn: branch.cityEn,
        cityBn: branch.cityBn,
        phone: branch.phone,
        emergencyPhone: branch.emergencyPhone,
        email: branch.email,
        operatingHoursEn: branch.operatingHoursEn,
        operatingHoursBn: branch.operatingHoursBn,
        directionsUrl: branch.directionsUrl,
        imageUrl: branch.imageUrl,
        servicesSummaryEn: branch.servicesSummaryEn,
        servicesSummaryBn: branch.servicesSummaryBn,
        publicationState: branch.publicationState,
        sortOrder: branch.sortOrder,
      },
    });
  }

  console.log("DeltaCare seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

