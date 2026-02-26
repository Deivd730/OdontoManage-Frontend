import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';


export interface UserProfile {
  id?: number;
  name: string;   
  email: string;  
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/user`; // Ajusta la ruta de tu API

  constructor(private http: HttpClient) { }

  // Obtiene el perfil completo del usuario actual
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`);
  }

  // Actualiza los datos del perfil
  updateProfile(profile: UserProfile): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/profile/update`, profile);
  }
}