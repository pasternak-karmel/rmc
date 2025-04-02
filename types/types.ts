export type Alert = {
  id: string;
  patient: string;
  patientId: string;
  type: string; //crtical, warning, info
  message: string;
  date: string;
  resolved: boolean;
};

export type Appointment = {
  id: string;
  patient: string;
  patientId: string;
  date: string;
  time: string;
  type: string;
  virtual: boolean;
  avatar: string;
  initials: string;
};

export type Patient = {
  id: string;
  name: string;
  age: number;
  stage: number;
  lastVisit: string;
  critical: boolean;
  avatar: string;
  initials: string;
};
