import { PrismaClient } from "@prisma/client";
import { createInitialSeedState } from "../src/server/db/seedData";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding DeltaCare Hospital Platform (PostgreSQL + Prisma)...");
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
      update: {
        nameEn: branch.nameEn,
        nameBn: branch.nameBn,
        hotline: branch.hotline ?? "10666",
        mapUrl: branch.mapUrl ?? branch.directionsUrl,
        isActive: branch.isActive ?? true,
      },
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
        hotline: branch.hotline ?? "10666",
        emergencyPhone: branch.emergencyPhone,
        email: branch.email,
        operatingHoursEn: branch.operatingHoursEn,
        operatingHoursBn: branch.operatingHoursBn,
        directionsUrl: branch.directionsUrl,
        mapUrl: branch.mapUrl ?? branch.directionsUrl,
        imageUrl: branch.imageUrl,
        servicesSummaryEn: branch.servicesSummaryEn,
        servicesSummaryBn: branch.servicesSummaryBn,
        isActive: branch.isActive ?? true,
        publicationState: branch.publicationState,
        sortOrder: branch.sortOrder,
      },
    });
  }

  for (const dept of state.departments) {
    await prisma.department.upsert({
      where: { slug: dept.slug },
      update: {
        nameEn: dept.nameEn,
        nameBn: dept.nameBn,
        shortDescEn: dept.shortDescEn ?? dept.shortDescriptionEn,
        shortDescBn: dept.shortDescBn ?? dept.shortDescriptionBn,
        servicesEn: dept.servicesEn ?? [],
        servicesBn: dept.servicesBn ?? [],
        commonConditionsEn: dept.commonConditionsEn ?? [],
        commonConditionsBn: dept.commonConditionsBn ?? [],
        displayOrder: dept.displayOrder ?? 1,
        isActive: dept.isActive ?? true,
      },
      create: {
        id: dept.id,
        branchId: dept.branchId,
        slug: dept.slug,
        nameEn: dept.nameEn,
        nameBn: dept.nameBn,
        shortDescriptionEn: dept.shortDescriptionEn,
        shortDescriptionBn: dept.shortDescriptionBn,
        shortDescEn: dept.shortDescEn ?? dept.shortDescriptionEn,
        shortDescBn: dept.shortDescBn ?? dept.shortDescriptionBn,
        overviewEn: dept.overviewEn,
        overviewBn: dept.overviewBn,
        servicesEn: dept.servicesEn ?? [],
        servicesBn: dept.servicesBn ?? [],
        commonConditionsEn: dept.commonConditionsEn ?? [],
        commonConditionsBn: dept.commonConditionsBn ?? [],
        iconName: dept.iconName,
        icon: dept.icon ?? dept.iconName,
        imageUrl: dept.imageUrl,
        displayOrder: dept.displayOrder ?? 1,
        isActive: dept.isActive ?? true,
        isFeaturedCareArea: dept.isFeaturedCareArea,
        publicationState: dept.publicationState,
      },
    });
  }

  for (const doc of state.doctors) {
    await prisma.doctor.upsert({
      where: { slug: doc.slug },
      update: {
        nameEn: doc.nameEn,
        nameBn: doc.nameBn,
        workplaceEn: doc.workplaceEn ?? "",
        workplaceBn: doc.workplaceBn ?? "",
        symptomTags: doc.symptomTags ?? [],
        consultationFeeBdt: doc.consultationFeeBdt,
        followupFeeBdt: doc.followupFeeBdt,
      },
      create: {
        id: doc.id,
        hospitalId: doc.hospitalId,
        departmentId: doc.departmentId,
        slug: doc.slug,
        nameEn: doc.nameEn,
        nameBn: doc.nameBn,
        designationEn: doc.designationEn,
        designationBn: doc.designationBn,
        qualificationsEn: doc.qualificationsEn,
        qualificationsBn: doc.qualificationsBn,
        workplaceEn: doc.workplaceEn ?? "",
        workplaceBn: doc.workplaceBn ?? "",
        experienceYears: doc.experienceYears,
        bmdcRegistrationNo: doc.bmdcRegistrationNo,
        bmdcRegNo: doc.bmdcRegistrationNo,
        bioEn: doc.bioEn,
        bioBn: doc.bioBn,
        clinicalInterestsEn: doc.clinicalInterestsEn,
        clinicalInterestsBn: doc.clinicalInterestsBn,
        symptomTags: doc.symptomTags ?? [],
        languagesEn: doc.languagesEn,
        languagesBn: doc.languagesBn,
        imageUrl: doc.imageUrl,
        photoUrl: doc.imageUrl,
        consultationFeeBdt: doc.consultationFeeBdt,
        followupFeeBdt: doc.followupFeeBdt,
        feeEffectiveFrom: new Date(doc.feeEffectiveFrom),
        isActive: true,
        publicationState: doc.publicationState,
      },
    });
  }

  for (const cs of state.chamberSchedules) {
    await prisma.doctorChamberSchedule.upsert({
      where: { id: cs.id },
      update: {
        chamberRoom: cs.chamberRoom,
        startTime: cs.startTime,
        endTime: cs.endTime,
        slotDurationMinutes: cs.slotDurationMinutes,
        isActive: cs.isActive,
      },
      create: {
        id: cs.id,
        doctorId: cs.doctorId,
        branchId: cs.branchId,
        chamberRoom: cs.chamberRoom,
        dayOfWeek: cs.dayOfWeek,
        startTime: cs.startTime,
        endTime: cs.endTime,
        breakStartTime: cs.breakStartTime,
        breakEndTime: cs.breakEndTime,
        slotDurationMinutes: cs.slotDurationMinutes,
        isActive: cs.isActive,
      },
    });
  }

  for (const notice of state.hospitalNotices) {
    await prisma.hospitalNotice.upsert({
      where: { slug: notice.slug },
      update: {
        titleEn: notice.titleEn,
        titleBn: notice.titleBn,
        isActive: notice.isActive,
      },
      create: {
        id: notice.id,
        slug: notice.slug,
        titleEn: notice.titleEn,
        titleBn: notice.titleBn,
        summaryEn: notice.summaryEn,
        summaryBn: notice.summaryBn,
        bodyEn: notice.bodyEn,
        bodyBn: notice.bodyBn,
        category: notice.category,
        branchId: notice.branchId,
        isPinned: notice.isPinned,
        isActive: notice.isActive,
      },
    });
  }

  console.log("DeltaCare PostgreSQL + Prisma seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
