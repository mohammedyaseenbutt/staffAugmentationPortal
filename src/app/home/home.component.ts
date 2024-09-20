import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

  constructor() {
    document.getElementById('signUpComponent')!.style.display = "none";
    document.getElementById('secondDashboardComponent')!.style.display = "block";
  }
}
