export interface Pathology {
    id: number;
    name: string;
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
    status: string;
}

export interface Odontogram {
    id?: number;
    patient: any;
    appointment?: any;
    type?: 'adult' | 'child';
    toothPathologies: ToothPathology[];
}
