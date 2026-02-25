import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService, UserProfile } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // Importante para formularios
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  loading = true;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    public authService: AuthService // Lo hacemos público para usarlo en el HTML
  ) {
    this.profileForm = this.fb.group({
      username: [{ value: '', disabled: true }], // No se suele dejar cambiar el username
      email: ['', [Validators.required, Validators.email]],
      nombre: [''],
      apellidos: [''],
      bio: ['']
    });
  }

  ngOnInit(): void {
    this.userService.getProfile().subscribe({
      next: (data) => {
        this.profileForm.patchValue(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar perfil', err);
        this.loading = false;
      }
    });
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      // getRawValue() incluye el campo 'username' aunque esté disabled
      this.userService.updateProfile(this.profileForm.getRawValue()).subscribe({
        next: (res) => alert('¡Perfil actualizado!'),
        error: (err) => alert('Error al guardar cambios')
      });
    }
  }
}