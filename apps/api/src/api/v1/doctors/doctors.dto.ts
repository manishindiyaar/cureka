export interface CreateDoctorDto {
  email: string;
  password?: string;
  full_name: string;
  specialty: string;
  hospital_id: string;
}

export interface CreateDoctorRequestDto {
  email: string;
  full_name: string;
  specialty: string;
  hospital_id: string;
}

export interface DoctorResponseDto {
  user_id: string;
  email: string;
  full_name: string;
  specialty: string;
  hospital_id: string;
  created_at: string;
  role: string;
  permissions: string[];
}