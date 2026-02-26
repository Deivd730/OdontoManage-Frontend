import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

export interface UserService {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = `${environment.apiUrl}/api/users`;

  constructor(private http: HttpClient) { }

  getMe(): Observable<UserService> {
    return this.http.get<UserService>(`${this.apiUrl}/me`);
  }
}