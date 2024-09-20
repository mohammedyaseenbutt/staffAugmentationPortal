import { Injectable } from '@angular/core';
import { Auth } from "aws-amplify";
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {

  constructor() {
    this.getAgent();
  }

  getAgent() {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-right',
      iconColor: 'white',
      customClass: {
        popup: 'colored-toast'
      },
      showConfirmButton: false,
      timer: 2000,
    })

    const loggedInUserAlert = localStorage.getItem('hasSeenLoginAlert');
    if(!loggedInUserAlert){
      Toast.fire({
        icon: 'success',
        title: 'Login successful!'
      });

      localStorage.setItem('hasSeenLoginAlert', 'true')
    }
    return Auth.currentUserInfo();
  }
}
