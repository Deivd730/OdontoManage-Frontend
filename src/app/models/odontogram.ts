export interface Pathology {
    id: number;
    name?: string;
    description?: string;
    color?: string;
}

export interface Treatment {
    id: number;
    name: string;
    description?: string;
    durationMinutes?: number;
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

export interface ToothTreatment {
    id?: number;
    treatment: Treatment;
    toothNumber: number;
    toothFace: number;
    status: 'pending' | 'done';
}

export interface BridgeTreatment {
    id?: number;
    treatment: Treatment;
    startTooth: number;
    endTooth: number;
    status: 'pending' | 'done';
}

export interface Odontogram {
    id?: number;
    patient: any;
    appointment?: any;
    type?: 'adult' | 'child';
    toothPathologies: ToothPathology[];
    toothTreatments: ToothTreatment[];
    bridgeTreatments: BridgeTreatment[];
}
