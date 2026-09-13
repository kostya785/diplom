export const DEFAULT_DOCTOR_PHOTO = "/default-doctor.svg";
export const API_URL = "http://localhost:3000";

export function getDoctorPhotoUrl(doctor) {
  if (doctor?.photoUrl) {
    return `${API_URL}/uploads/doctors/${doctor.photoUrl}`;
  }
  return DEFAULT_DOCTOR_PHOTO;
}
