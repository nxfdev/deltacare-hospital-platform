// ============================================================================
// Evercare Medical Technology & Diagnostic Equipment catalog.
// Photos: Wikimedia Commons (public domain / CC licensed), credited per item.
// ============================================================================

export interface MedicalTechnology {
  id: string;
  nameEn: string;
  nameBn: string;
  descriptionEn: string;
  descriptionBn: string;
  imageUrl: string;
  credit: string;
}

const C = "https://thumb.wikimedia.org/wikipedia/commons/thumb";
const U = "https://upload.wikimedia.org/wikipedia/commons";

export const MEDICAL_TECHNOLOGY: Record<string, MedicalTechnology> = {
  mri: {
    id: "mri",
    nameEn: "3T Silent MRI",
    nameBn: "৩ টেসলা সাইলেন্ট এমআরআই",
    descriptionEn:
      "High-field 3 Tesla MRI with noise-reduction sequences for brain, spine and joint imaging — calmer scans for children and anxious patients.",
    descriptionBn:
      "মস্তিষ্ক, মেরুদণ্ড ও জয়েন্টের সূক্ষ্ম ছবির জন্য ৩ টেসলা এমআরআই — কম শব্দে স্ক্যান, শিশু ও উদ্বিগ্ন রোগীদের জন্য আরামদায়ক।",
    imageUrl: `${C}/8/8e/Mobile_MRI_scanner_at_the_Royal_Stoke_University_Hospital_-_geograph.org.uk_-_4276444.jpg/960px-Mobile_MRI_scanner_at_the_Royal_Stoke_University_Hospital_-_geograph.org.uk_-_4276444.jpg`,
    credit: "Wikimedia Commons, CC BY-SA 2.0",
  },
  ct: {
    id: "ct",
    nameEn: "512-Slice Cardiac CT",
    nameBn: "৫১২-স্লাইস কার্ডিয়াক সিটি",
    descriptionEn:
      "Captures the whole heart in a single beat for non-invasive coronary angiography, with low-dose protocols for routine body scans.",
    descriptionBn:
      "এক হৃদস্পন্দনেই পুরো হৃদপিণ্ডের ছবি — কাটাছেঁড়া ছাড়াই করোনারি এনজিওগ্রাম, এবং কম রেডিয়েশনে সাধারণ সিটি স্ক্যান।",
    imageUrl: `${C}/e/e4/AS%26E_CT_Scanner.jpg/960px-AS%26E_CT_Scanner.jpg`,
    credit: "Wikimedia Commons, CC BY 4.0",
  },
  cathlab: {
    id: "cathlab",
    nameEn: "Biplane Cath Lab",
    nameBn: "বাইপ্লেন ক্যাথ ল্যাব",
    descriptionEn:
      "Two-angle live X-ray imaging for angiograms, angioplasty and stenting, with a 24/7 primary-PCI team for heart attacks.",
    descriptionBn:
      "দুই দিক থেকে একসাথে লাইভ এক্স-রে — এনজিওগ্রাম, এনজিওপ্লাস্টি ও রিং পরানো; হার্ট অ্যাটাকে ২৪/৭ জরুরি প্রাইমারি পিসিআই টিম।",
    imageUrl: `${C}/1/1b/A_cardiac_catheterization_procedure_in_the_Naval_Medical_Center_San_Diego_hospital%E2%80%99s_cardiac_catheterization_laboratory.jpg/960px-A_cardiac_catheterization_procedure_in_the_Naval_Medical_Center_San_Diego_hospital%E2%80%99s_cardiac_catheterization_laboratory.jpg`,
    credit: "Wikimedia Commons, public domain",
  },
  echo: {
    id: "echo",
    nameEn: "3D Echocardiography",
    nameBn: "থ্রিডি ইকোকার্ডিওগ্রাফি",
    descriptionEn: "Real-time heart ultrasound to assess valves, pumping strength and congenital defects.",
    descriptionBn: "হৃদপিণ্ডের ভাল্ভ, পাম্পিং ক্ষমতা ও জন্মগত ত্রুটি দেখতে রিয়েল-টাইম আলট্রাসাউন্ড।",
    imageUrl: `${C}/d/da/2D_ECHOCARDIOGRAM_MACHINE_WITH_A_TABLE_AND_A_STETHOSCOPE.jpg/960px-2D_ECHOCARDIOGRAM_MACHINE_WITH_A_TABLE_AND_A_STETHOSCOPE.jpg`,
    credit: "Wikimedia Commons, CC BY-SA 4.0",
  },
  fibroscan: {
    id: "fibroscan",
    nameEn: "FibroScan Liver Elastography",
    nameBn: "ফাইব্রোস্ক্যান লিভার পরীক্ষা",
    descriptionEn:
      "A painless 10-minute scan that measures liver stiffness and fat — ideal for fatty liver and hepatitis B follow-up without a biopsy.",
    descriptionBn:
      "ব্যথাহীন ১০ মিনিটের পরীক্ষায় লিভারের শক্ততা ও চর্বির পরিমাণ মাপা হয় — ফ্যাটি লিভার ও হেপাটাইটিস বি রোগীদের বায়োপসি ছাড়াই ফলো-আপ।",
    imageUrl: `${C}/f/f6/A_medical_ultrasound_linear_array_probe%2C_scan_head%2C_transducer.jpg/960px-A_medical_ultrasound_linear_array_probe%2C_scan_head%2C_transducer.jpg`,
    credit: "Wikimedia Commons, CC BY 4.0",
  },
  endoscopy: {
    id: "endoscopy",
    nameEn: "HD Endoscopy & ERCP Suite",
    nameBn: "এইচডি এন্ডোস্কপি ও ইআরসিপি স্যুট",
    descriptionEn:
      "High-definition gastroscopy and colonoscopy under sedation, with ERCP for bile-duct stones and polyp removal in the same session.",
    descriptionBn:
      "ঘুমের ওষুধ দিয়ে আরামদায়ক এইচডি গ্যাস্ট্রোস্কপি ও কোলোনোস্কপি; পিত্তনালির পাথর অপসারণে ইআরসিপি এবং একই সেশনে পলিপ অপসারণ।",
    imageUrl: `${C}/d/d5/Endoscopy_room.jpg/960px-Endoscopy_room.jpg`,
    credit: "Wikimedia Commons, CC BY 2.0",
  },
  ot: {
    id: "ot",
    nameEn: "Modular Laminar-Airflow OT",
    nameBn: "মডুলার ল্যামিনার এয়ারফ্লো ওটি",
    descriptionEn:
      "HEPA-filtered operating theatres with laminar airflow to minimise infection during joint replacement, cardiac and complex surgery.",
    descriptionBn:
      "হেপা-ফিল্টার ও ল্যামিনার বায়ুপ্রবাহযুক্ত অপারেশন থিয়েটার — জয়েন্ট প্রতিস্থাপন, হার্ট ও জটিল অস্ত্রোপচারে সংক্রমণের ঝুঁকি সর্বনিম্ন।",
    imageUrl: `${C}/2/2e/Cardiac_surgery_operating_room.jpg/960px-Cardiac_surgery_operating_room.jpg`,
    credit: "Wikimedia Commons, CC BY-SA 4.0",
  },
  nicu: {
    id: "nicu",
    nameEn: "Level-III NICU",
    nameBn: "লেভেল-৩ এনআইসিইউ",
    descriptionEn:
      "Neonatal intensive care with incubators, ventilators and round-the-clock neonatologists for premature and critically ill newborns.",
    descriptionBn:
      "সময়ের আগে জন্ম নেওয়া ও গুরুতর অসুস্থ নবজাতকদের জন্য ইনকিউবেটর, ভেন্টিলেটর ও ২৪ ঘণ্টা নবজাতক বিশেষজ্ঞসহ নিবিড় পরিচর্যা।",
    imageUrl: `${C}/d/d9/MODULAR_NICU_WITH_HEPAFILTERS.jpg/960px-MODULAR_NICU_WITH_HEPAFILTERS.jpg`,
    credit: "Wikimedia Commons, CC BY-SA 4.0",
  },
  icu: {
    id: "icu",
    nameEn: "Multi-Disciplinary ICU & HDU",
    nameBn: "আইসিইউ ও এইচডিইউ",
    descriptionEn:
      "Ventilator-equipped intensive care beds with central monitoring — including dedicated care for dengue shock and severe infections.",
    descriptionBn:
      "ভেন্টিলেটর ও সেন্ট্রাল মনিটরিংসহ নিবিড় পরিচর্যা শয্যা — ডেঙ্গু শক ও গুরুতর সংক্রমণের জন্য বিশেষ ব্যবস্থা।",
    imageUrl: `${C}/c/c4/Clinicians_in_Intensive_Care_Unit.jpg/960px-Clinicians_in_Intensive_Care_Unit.jpg`,
    credit: "Wikimedia Commons, CC BY-SA 3.0",
  },
  dialysis: {
    id: "dialysis",
    nameEn: "Haemodialysis Unit",
    nameBn: "হিমোডায়ালাইসিস ইউনিট",
    descriptionEn:
      "Modern dialysis machines with RO-treated water, separate hepatitis-screened stations and morning, day and evening shifts.",
    descriptionBn:
      "আরও-পরিশোধিত পানিসহ আধুনিক ডায়ালাইসিস মেশিন, হেপাটাইটিস রোগীদের জন্য আলাদা স্টেশন এবং সকাল, দুপুর ও সন্ধ্যা শিফট।",
    imageUrl: `${C}/8/8a/Dialog-dialysis-machine-b-braun.jpg/960px-Dialog-dialysis-machine-b-braun.jpg`,
    credit: "Wikimedia Commons, CC BY-SA 4.0",
  },
  linac: {
    id: "linac",
    nameEn: "Linear Accelerator Radiotherapy",
    nameBn: "লিনিয়ার অ্যাক্সিলারেটর রেডিওথেরাপি",
    descriptionEn:
      "Image-guided IMRT and VMAT radiotherapy that targets tumours precisely while sparing healthy tissue.",
    descriptionBn:
      "ইমেজ-গাইডেড আইএমআরটি ও ভিএমএটি রেডিওথেরাপি — সুস্থ টিস্যু বাঁচিয়ে নিখুঁতভাবে টিউমারে বিকিরণ।",
    imageUrl: `${C}/1/16/Varian-like_Linear_Accelerator_for_Precision_Radiation_Therapy.jpg/960px-Varian-like_Linear_Accelerator_for_Precision_Radiation_Therapy.jpg`,
    credit: "Wikimedia Commons, CC0",
  },
  eeg: {
    id: "eeg",
    nameEn: "Video EEG & Nerve Conduction Lab",
    nameBn: "ভিডিও ইইজি ও নার্ভ কন্ডাকশন ল্যাব",
    descriptionEn: "Records brain and nerve activity to evaluate seizures, neuropathy and sleep disorders.",
    descriptionBn: "খিঁচুনি, স্নায়ুর দুর্বলতা ও ঘুমের সমস্যা নির্ণয়ে মস্তিষ্ক ও স্নায়ুর কার্যক্রম রেকর্ড করা হয়।",
    imageUrl: `${C}/c/ce/EEG_Experiment.jpg/960px-EEG_Experiment.jpg`,
    credit: "Wikimedia Commons, CC0",
  },
  xray: {
    id: "xray",
    nameEn: "Digital Radiography",
    nameBn: "ডিজিটাল এক্স-রে",
    descriptionEn: "Flat-panel digital X-ray with instant images and lower radiation, open 24/7 for emergencies.",
    descriptionBn: "কম রেডিয়েশনে তাৎক্ষণিক ছবি দেয় এমন ফ্ল্যাট-প্যানেল ডিজিটাল এক্স-রে, জরুরি রোগীদের জন্য ২৪/৭ খোলা।",
    imageUrl: `${C}/d/d1/Hospital_Radiology_Room_Philips_DigitalDiagnost_Digital_Radiography_System.jpg/960px-Hospital_Radiology_Room_Philips_DigitalDiagnost_Digital_Radiography_System.jpg`,
    credit: "Wikimedia Commons, CC BY-SA 4.0",
  },
  mammo: {
    id: "mammo",
    nameEn: "3D Digital Mammography",
    nameBn: "থ্রিডি ডিজিটাল ম্যামোগ্রাফি",
    descriptionEn: "Tomosynthesis breast imaging for early cancer detection, with female technologists.",
    descriptionBn: "স্তন ক্যানসার প্রাথমিক পর্যায়ে শনাক্তে টোমোসিন্থেসিস ম্যামোগ্রাফি, নারী টেকনোলজিস্ট দ্বারা পরিচালিত।",
    imageUrl: `${C}/9/98/Mammography_machine.jpg/960px-Mammography_machine.jpg`,
    credit: "Wikimedia Commons, public domain",
  },
  ultrasound: {
    id: "ultrasound",
    nameEn: "4D Ultrasound & Doppler",
    nameBn: "ফোরডি আলট্রাসাউন্ড ও ডপলার",
    descriptionEn: "Detailed pregnancy anomaly scans, foetal growth monitoring and abdominal Doppler studies.",
    descriptionBn: "গর্ভকালীন অ্যানোমালি স্ক্যান, শিশুর বৃদ্ধি পর্যবেক্ষণ ও পেটের ডপলার পরীক্ষা।",
    imageUrl: `${C}/f/f4/Pelvic_Ultrasound_Examination_Navi_Mumbai_India.jpg/960px-Pelvic_Ultrasound_Examination_Navi_Mumbai_India.jpg`,
    credit: "Wikimedia Commons, CC BY 4.0",
  },
  audiometry: {
    id: "audiometry",
    nameEn: "Sound-Proof Audiometry Booth",
    nameBn: "সাউন্ডপ্রুফ অডিওমেট্রি বুথ",
    descriptionEn: "Hearing tests for adults and newborn screening (OAE/BERA) in an acoustically isolated room.",
    descriptionBn: "শব্দনিরোধক কক্ষে প্রাপ্তবয়স্কদের শ্রবণ পরীক্ষা ও নবজাতকের স্ক্রিনিং (ওএই/বেরা)।",
    imageUrl: `${U}/9/9b/Realiza%C3%A7%C3%A3o_de_Audiometria.jpg`,
    credit: "Wikimedia Commons, CC BY-SA 4.0",
  },
  sinusEndoscopy: {
    id: "sinusEndoscopy",
    nameEn: "Endoscopic Sinus & Skull-Base Surgery",
    nameBn: "এন্ডোস্কপিক সাইনাস সার্জারি",
    descriptionEn: "Camera-guided surgery through the nose for chronic sinusitis and polyps — no external scar.",
    descriptionBn: "দীর্ঘমেয়াদি সাইনুসাইটিস ও নাকের পলিপের জন্য নাকের ভেতর দিয়ে ক্যামেরা-নির্দেশিত অস্ত্রোপচার — বাইরে কোনো দাগ নেই।",
    imageUrl: `${U}/2/23/Endoscopic_Sinus_Surgery.jpg`,
    credit: "Wikimedia Commons, CC BY-SA 3.0",
  },
  phototherapy: {
    id: "phototherapy",
    nameEn: "Narrow-Band UVB Phototherapy",
    nameBn: "ন্যারো-ব্যান্ড ইউভিবি ফটোথেরাপি",
    descriptionEn: "Controlled light therapy cabins for psoriasis, vitiligo and chronic eczema.",
    descriptionBn: "সোরিয়াসিস, শ্বেতী ও দীর্ঘমেয়াদি একজিমার জন্য নিয়ন্ত্রিত আলোক থেরাপি।",
    imageUrl: `${C}/f/f0/Dermatologisk_lysbehandling.jpg/960px-Dermatologisk_lysbehandling.jpg`,
    credit: "Wikimedia Commons, CC BY-SA 4.0",
  },
};

const DEPARTMENT_TECH: Record<string, string[]> = {
  "dept-cardiology": ["cathlab", "ct", "echo"],
  "dept-critical-care": ["icu", "xray", "ct"],
  "dept-dermatology": ["phototherapy", "ot"],
  "dept-ent": ["sinusEndoscopy", "audiometry", "ct"],
  "dept-gastroenterology": ["endoscopy", "fibroscan", "ct"],
  "dept-gynecology": ["ultrasound", "mammo", "ot"],
  "dept-internal-medicine": ["xray", "ultrasound", "ct"],
  "dept-medicine-dengue": ["icu", "ultrasound", "xray"],
  "dept-nephrology": ["dialysis", "ultrasound", "ct"],
  "dept-neurology": ["mri", "eeg", "ct"],
  "dept-oncology": ["linac", "ct", "mammo"],
  "dept-orthopedics": ["ot", "mri", "xray"],
  "dept-pediatrics": ["nicu", "ultrasound", "xray"],
};

export function getTechnologyForDepartment(departmentId?: string | null): MedicalTechnology[] {
  const ids = (departmentId && DEPARTMENT_TECH[departmentId]) || ["mri", "ct", "xray"];
  return ids.map((id) => MEDICAL_TECHNOLOGY[id]).filter(Boolean);
}
