import { Component } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { RouterOutlet } from '@angular/router'; // Importa RouterOutlet, NO Router


@Component({
  selector: 'app-mainlayout.component',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './mainlayout.component.html',
  styleUrl: './mainlayout.component.css',
})
export class MainlayoutComponent {

}
