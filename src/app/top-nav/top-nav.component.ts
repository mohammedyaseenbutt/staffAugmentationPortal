import { Component, ElementRef, Renderer2 } from '@angular/core';
import { API, Auth, Storage } from 'aws-amplify';
import { Router } from '@angular/router';
import { AuthServiceService } from 'src/services/auth-service.service';
import { ICustomer } from 'src/interfaces/icustomer';
// <<<<<<< Updated upstream
import Swal from 'sweetalert2';
// =======
import { ProfileService } from 'src/services/profile.service';
// >>>>>>> Stashed changes

@Component({
  selector: 'app-top-nav',
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.css']
})
export class TopNavComponent {
  customerID: any;
  customerData!: ICustomer;
  adminNameFromDynamo: any;
  customData: any;



  constructor(private router: Router, private authService: AuthServiceService, private renderer: Renderer2, private elementRef: ElementRef, public profilePicture: ProfileService) {
    this.authService.getAgent().then((agentData) => {
      this.getAgentData(agentData);
    });
  }

  async checkAuthData(agentData: any) {
    this.customerID = agentData.attributes.sub;
  }

  async getAgentData(agentData: any) {
    const profilePictureShared = await this.profilePicture.getSharedVariable();
    const agentDataShared = await this.profilePicture.getSharedAgent();

    if(agentDataShared != null && agentDataShared != 'No Customer Data Found!' && profilePictureShared === 'No Image Found!') {
      console.log('Customer Data Found only in Dynamo');
      this.adminNameFromDynamo = agentDataShared.CustomerData.name;

      const fullName = agentDataShared.CustomerData.name;
      const spaceIndex = fullName.indexOf(' ');

      let firstName = '';
      let lastName = '';

      if (spaceIndex !== -1) {
        firstName = fullName.slice(0, spaceIndex);
        lastName = fullName.slice(spaceIndex + 1);

        const initials = firstName.charAt(0) + lastName.charAt(0);
        const profileImage = this.elementRef.nativeElement.querySelector('#userDropDown');

        this.renderer.setProperty(profileImage, 'textContent', initials);
      }
      else{
        const initials = agentDataShared.CustomerData.name.charAt(0);
        const profileImage = this.elementRef.nativeElement.querySelector('#userDropDown');

        this.renderer.setProperty(profileImage, 'textContent', initials);
      }
    }
    else if(agentDataShared != null && agentDataShared != 'No Customer Data Found!' && profilePictureShared !== null && profilePictureShared !== 'No Image Found!') {
      console.log('CustomerData Found in Dynamo and S3');
      this.adminNameFromDynamo = agentDataShared.CustomerData.name;
 
      const fullName = agentDataShared.CustomerData.name;
      const spaceIndex = fullName.indexOf(' ');

      let firstName = '';
      let lastName = '';

      if (spaceIndex !== -1) {
        firstName = fullName.slice(0, spaceIndex);
        lastName = fullName.slice(spaceIndex + 1);

        const initials = firstName.charAt(0) + lastName.charAt(0);
        const profileImage = this.elementRef.nativeElement.querySelector('#userDropDown');

        this.renderer.setProperty(profileImage, 'textContent', initials);
      }
      else{
        const initials = agentDataShared.CustomerData.name.charAt(0);
        const profileImage = this.elementRef.nativeElement.querySelector('#userDropDown');

        this.renderer.setProperty(profileImage, 'textContent', initials);
      }

      let profileButton = document.getElementById('userDropDown');
      profileButton!.textContent = '';

      let profilePicture = document.createElement('img');
      profileButton!.appendChild(profilePicture);

      profilePicture!.src = profilePictureShared;
      profilePicture!.style.height = '33px';

      profilePicture!.style.width = '33px';
    }
    else if(agentDataShared === 'No Customer Data Found!' && profilePictureShared === 'No Image Found!') {
      console.log('Customer only exists in Auth');
      this.adminNameFromDynamo = null;
      this.customData = agentData;
      
      if(agentData.attributes.name != undefined){
        const fullName = agentData.attributes.name;
        const spaceIndex = fullName.indexOf(' ');
  
        let firstName = '';
        let lastName = '';
  
        if (spaceIndex !== -1) {
          firstName = fullName.slice(0, spaceIndex);
          lastName = fullName.slice(spaceIndex + 1);
  
          const initials = firstName.charAt(0) + lastName.charAt(0);
          const profileImage = this.elementRef.nativeElement.querySelector('#userDropDown');
  
          this.renderer.setProperty(profileImage, 'textContent', initials);
        }
        else{
          const initials = agentData.attributes.name.charAt(0);
          const profileImage = this.elementRef.nativeElement.querySelector('#userDropDown');
  
          this.renderer.setProperty(profileImage, 'textContent', initials);
        }
      }
    }
    else {
      setTimeout(() => {
        this.getAgentData(agentData);
      }, 10);
    }
  }

  // async checkUserData(agentData: any) {
  //   try{
  //     //@ts-ignore
  //     const response = await API.get("SSClientCRUD", "/items/listCustomer/" + this.customerID);
  //     this.customerData = response.Items[0];

  //     if(response.Count != 0) {
  //       Storage.list('customer/profile_' + this.customerID + '/')
  //       .then((profileImage) => {
  //         if(agentData.attributes.name != undefined){
  //           const fullName = agentData.attributes.name;
  //           const spaceIndex = fullName.indexOf(' ');
      
  //           let firstName = '';
  //           let lastName = '';
      
  //           if (spaceIndex !== -1) {
  //             firstName = fullName.slice(0, spaceIndex);
  //             lastName = fullName.slice(spaceIndex + 1);
      
  //             const initials = firstName.charAt(0) + lastName.charAt(0);
  //             const profileImage = this.elementRef.nativeElement.querySelector('#userDropDown');
      
  //             this.renderer.setProperty(profileImage, 'textContent', initials);
  //           }
  //           else{
  //             const initials = agentData.attributes.name.charAt(0);
  //             const profileImage = this.elementRef.nativeElement.querySelector('#userDropDown');
      
  //             this.renderer.setProperty(profileImage, 'textContent', initials);
  //           }
  //         }
  //         if(profileImage.results.length != 0){
  //           let profileButton = document.getElementById('userDropDown');
  //           profileButton!.textContent = '';

  //           let profilePicture = document.createElement('img');
  //           profileButton!.appendChild(profilePicture);

  //           profilePicture!.src = 'https://ssaugmentationclient191322-dev.s3.us-west-2.amazonaws.com/public/' +  profileImage.results[0].key;
  //           profilePicture!.style.height = '33px';

  //           profilePicture!.style.width = '33px';
  //         }
  //         else {
  //           if(this.customerData.CustomerData.name != undefined){
  //             const fullName = this.customerData.CustomerData.name;
  //             const spaceIndex = fullName.indexOf(' ');
    
  //             let firstName = '';
  //             let lastName = '';
    
  //             if (spaceIndex !== -1) {
  //               firstName = fullName.slice(0, spaceIndex);
  //               lastName = fullName.slice(spaceIndex + 1);
      
  //               const initials = firstName.charAt(0) + lastName.charAt(0);
  //               const profileImage = this.elementRef.nativeElement.querySelector('#userDropDown');
      
  //               this.renderer.setProperty(profileImage, 'textContent', initials);
  //             }
  //             else {
  //               const initials = this.customerData.CustomerData.name.charAt(0)
  //               const profileImage = this.elementRef.nativeElement.querySelector('#userDropDown');
      
  //               this.renderer.setProperty(profileImage, 'textContent', initials);
  //             }
  //           }
  //         }
  //       });
  //     }
  //     else{
  //       if(agentData.attributes.name != undefined){
  //         const fullName = agentData.attributes.name;
  //         const spaceIndex = fullName.indexOf(' ');
    
  //         let firstName = '';
  //         let lastName = '';
    
  //         if (spaceIndex !== -1) {
  //           firstName = fullName.slice(0, spaceIndex);
  //           lastName = fullName.slice(spaceIndex + 1);
    
  //           const initials = firstName.charAt(0) + lastName.charAt(0);
  //           const profileImage = this.elementRef.nativeElement.querySelector('#userDropDown');
    
  //           this.renderer.setProperty(profileImage, 'textContent', initials);
  //         }
  //         else{
  //           const initials = agentData.attributes.name.charAt(0);
  //           const profileImage = this.elementRef.nativeElement.querySelector('#userDropDown');
    
  //           this.renderer.setProperty(profileImage, 'textContent', initials);
  //         }
  //       }
  //     }
  //  }
  //  catch(error: any){
  //    console.error('Error at listCustomer: ', error)
  //  }
  // }

  updateProfileModal() {
    let showCustomerModal = document.getElementById('launchModal');
    showCustomerModal?.click();
  }

  logOutUser() {
    Swal.fire({
      title: 'Are you sure you want to log out?',
      icon: 'warning',
      background: 'white',
      showDenyButton: true,
      confirmButtonText: 'Yes',
      confirmButtonColor: 'maroon',
      denyButtonColor: 'grey',
      denyButtonText: `No`,
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('hasSeenLoginAlert');

        Auth.signOut().then((value) => console.log(value)).catch((e) => console.log(e)).finally(() => {
          location.reload();
      });
      }
      else{

      }
    });
  }
}
