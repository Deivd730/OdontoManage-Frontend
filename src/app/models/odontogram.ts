export interface Pathology {
    id: number;
    name?: string;
    description?: string;
    color?: string;
}

export interface Tooth {
    id: number;
    toothNumber: number;
}

export interface ToothPathology {
    id?: number;
    tooth: Tooth;
    pathology: Pathology;
    toothFace: number;
}

export interface Odontogram {
    id?: number;
    patient: any;
    appointment?: any;
    type?: 'adult' | 'child';
    toothPathologies: ToothPathology[];
}
