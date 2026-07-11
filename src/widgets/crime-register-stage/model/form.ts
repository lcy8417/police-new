import type { CrimeRegisterInput } from "@/entities/crime"

/**
 * Working form state for `/crimeRegister`, mirroring legacy
 * `CrimeRegister.jsx`'s `formData`. `image` is nullable while empty; every
 * other field is a controlled string. Maps 1:1 onto `CrimeRegisterInput`
 * once `image` is validated non-null at submit time.
 */
export interface CrimeFormData extends Omit<CrimeRegisterInput, "image"> {
  image: string | null
}

export const EMPTY_FORM: CrimeFormData = {
  image: null,
  crimeNumber: "",
  imageNumber: "",
  crimeName: "",
  findTime: "",
  requestOffice: "",
  findMethod: "",
}
