import { apiClient } from './client';

export interface Dependent {
    id: number;
    relationship: string;
    relationship_label: string;
    full_name: string;
    birth_date: string | null;
    age: number | null;
    gender: string | null;
    validation_status: 'pending' | 'validated' | 'rejected';
    validation_status_label: string;
    rejection_reason: string | null;
    photo_url: string | null;
}

export interface DependentDetail extends Dependent {
    birth_place: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    is_active: boolean;
    documents: {
        id_card: string | null;
        birth_certificate: string | null;
        marriage_certificate: string | null;
    };
}

export interface NewDependentPayload {
    relationship: 'spouse' | 'child' | 'father' | 'mother';
    first_name?: string;
    last_name: string;
    birth_date: string;
    birth_place?: string;
    gender: 'M' | 'F';
    phone?: string;
    email?: string;
    address?: string;
    photoFile?: { uri: string; name: string; type: string };
    idCardFile?: { uri: string; name: string; type: string };
    birthCertificateFile: { uri: string; name: string; type: string };
    marriageCertificateFile?: { uri: string; name: string; type: string };
}

export async function fetchDependents(): Promise<Dependent[]> {
    const { data } = await apiClient.get<{ dependents: Dependent[] }>('/employee/dependents');
    return data.dependents;
}

export async function fetchDependent(id: number): Promise<DependentDetail> {
    const { data } = await apiClient.get<{ dependent: DependentDetail }>(`/employee/dependents/${id}`);
    return data.dependent;
}

export async function createDependent(payload: NewDependentPayload): Promise<DependentDetail> {
    const formData = new FormData();
    formData.append('relationship', payload.relationship);
    if (payload.first_name) formData.append('first_name', payload.first_name);
    formData.append('last_name', payload.last_name);
    formData.append('birth_date', payload.birth_date);
    if (payload.birth_place) formData.append('birth_place', payload.birth_place);
    formData.append('gender', payload.gender);
    if (payload.phone) formData.append('phone', payload.phone);
    if (payload.email) formData.append('email', payload.email);
    if (payload.address) formData.append('address', payload.address);

    // @ts-expect-error shape attendue par React Native pour les fichiers
    if (payload.photoFile) formData.append('photo', payload.photoFile);
    // @ts-expect-error idem
    if (payload.idCardFile) formData.append('id_card_path', payload.idCardFile);
    // @ts-expect-error idem
    formData.append('birth_certificate_path', payload.birthCertificateFile);
    // @ts-expect-error idem
    if (payload.marriageCertificateFile) formData.append('marriage_certificate_path', payload.marriageCertificateFile);

    const { data } = await apiClient.post<{ dependent: DependentDetail }>('/employee/dependents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return data.dependent;
}

export async function deleteDependent(id: number): Promise<void> {
    await apiClient.delete(`/employee/dependents/${id}`);
}