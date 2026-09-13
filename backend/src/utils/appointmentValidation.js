export function calculateAge(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

const SPECIALTY_RULES = [
  {
    match: (specialty) => /гинеколог/i.test(specialty),
    check: (patient) => {
      if (patient.gender === "MALE") {
        return {
          type: "gender_specialty",
          message:
            "Гинеколог специализируется на женском здоровье. Вам точно нужен именно этот врач? Вы можете продолжить запись, если уверены."
        };
      }
      return null;
    }
  },
  {
    match: (specialty) => /педиатр/i.test(specialty),
    check: (patient) => {
      const age = calculateAge(patient.birthDate);
      if (age !== null && age >= 18) {
        return {
          type: "age_pediatrician",
          message:
            "Педиатр принимает детей и подростков. Вам уже исполнилось 18 лет — возможно, вам больше подойдёт терапевт. Продолжить запись к педиатру?"
        };
      }
      return null;
    }
  },
  {
    match: (specialty) => /терапевт/i.test(specialty),
    check: (patient) => {
      const age = calculateAge(patient.birthDate);
      if (age !== null && age < 18) {
        return {
          type: "age_therapist",
          message:
            "Терапевт обычно принимает взрослых пациентов. Вам менее 18 лет — возможно, вам больше подойдёт педиатр. Продолжить запись к терапевту?"
        };
      }
      return null;
    }
  }
];

const CATEGORY_RULES = [
  {
    match: (category) => /гинеколог/i.test(category || ""),
    check: (patient) => {
      if (patient.gender === "MALE") {
        return {
          type: "gender_category",
          message:
            "Вы записываетесь на услугу из раздела «Гинекология». Вам точно нужна именно эта услуга? Вы можете продолжить запись."
        };
      }
      return null;
    }
  }
];

export function getAppointmentWarnings(patient, doctor, service) {
  const warnings = [];

  for (const rule of SPECIALTY_RULES) {
    if (rule.match(doctor.specialty)) {
      const warning = rule.check(patient);
      if (warning) warnings.push(warning);
    }
  }

  if (service?.category) {
    for (const rule of CATEGORY_RULES) {
      if (rule.match(service.category)) {
        const warning = rule.check(patient);
        if (warning && !warnings.some((w) => w.type === warning.type)) {
          warnings.push(warning);
        }
      }
    }
  }

  return warnings;
}
