import { Component, ElementRef, Renderer2 } from '@angular/core';
import { API, Auth, Storage } from 'aws-amplify';
import Amplify from '@aws-amplify/core';
import awsExports from '../../aws-exports';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IService } from '../../interfaces/iservice'
import { ListServicesServiceService } from 'src/services/list-services-service.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import * as bootstrap from 'bootstrap';
import { Modal } from 'bootstrap';
import { ICustomer } from 'src/interfaces/icustomer';
import Swal from 'sweetalert2';
import { hide, start } from '@popperjs/core';
import { DatePipe } from '@angular/common';
import { ProfileService } from 'src/services/profile.service';
import { AuthServiceService } from 'src/services/auth-service.service';
import { saveAs } from 'file-saver';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

declare var html2pdf: any;
interface Member {
  name: string;
  imageUrl: string;
  title: string;
  expanded: boolean;
  subMembers?: Member[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent {
  files: File[] = [];
  serviceForm!: FormGroup;

  customerID: any;
  listAllServices!: IService[];

  listUserClickService!: IService;
  viewUserServiceData!: IService;

  private subscription!: Subscription;
  clickedServicePK: any;

  editUserServiceData!: IService;
  editable = false;

  showUserClickedService = false;
  previewImageUrl!: string;

  customerData!: ICustomer;
  customerFormData!: FormGroup;

  profilePictureURL: any;
  profilePictureEvent!: Event;

  numberOfMonths: any;
  startDateForm: any;

  cardPaymentForm!: FormGroup;
  chequePaymentFiles: File[] = [];

  wireTransferPaymentFiles: File[] = [];
  days: number = 0;

  hours: number = 0;
  minutes: number = 0;

  seconds: number = 0;
  showEnd: boolean = false;

  planStatusTime: any;
  constructor(private authService: AuthServiceService, private formBuilder: FormBuilder, private listServicesService: ListServicesServiceService, public router: Router, private renderer: Renderer2, private elementRef: ElementRef, private datePipe: DatePipe, public profilePicture: ProfileService, private http: HttpClient) {
    Amplify.configure(awsExports);

    this.authService.getAgent().then((customerData) => {
      this.customerFormData.controls['email'].setValue(customerData.attributes.email);
      if(customerData.attributes.name != undefined){
        this.customerFormData.controls['name'].setValue(customerData.attributes.name);

        const fullName = customerData.attributes.name;
        const spaceIndex = fullName.indexOf(' ');

        let firstName = '';
        let lastName = '';

        if (spaceIndex !== -1) {
          firstName = fullName.slice(0, spaceIndex);
          lastName = fullName.slice(spaceIndex + 1);

          const initials = firstName.charAt(0) + lastName.charAt(0);
          const profileImage = this.elementRef.nativeElement.querySelector('#imagePreview');

          this.renderer.setProperty(profileImage, 'textContent', initials);
        }
        else {
          const initials = customerData.attributes.name.charAt(0);
          const profileImage = this.elementRef.nativeElement.querySelector('#imagePreview');

          this.renderer.setProperty(profileImage, 'textContent', initials);
        }
      }

      if(customerData.attributes.sub != undefined){
        this.customerID = customerData.attributes.sub;
        this.listCustomer();
      }
    });

    // calling Subscription function from list Services Service
    this.subscription = listServicesService.filterUserService.subscribe((data) => {
      this.listAllServices = data;
    });
    // calling Subscription function from list Services Service Ends

    // Initializing Service Form
    const currentDate = new Date();
    const formattedDate = this.datePipe.transform(currentDate, 'yyyy-MM-dd');

    this.serviceForm = this.formBuilder.group({
      planName: [''],
      planDuration: ['1'],
      teamMembers: [''],
      startDate: [formattedDate],
      endDate: [''],
      planAmount: [''],
      planStatus: ['Basic'],
      basic: this.formBuilder.group({
        planStatus: [''],
      }),
      discovery: this.formBuilder.array([
        this.formBuilder.group({
          name: [''],
          title: [''],
          imageUrl: [''],
          expanded: [''],
          subMembers: this.formBuilder.array([
            this.formBuilder.group({
              name: [''],
              title: [''],
              imageUrl: [''],
              expanded: [''],
            })
          ])
        }),
      ]),
      technicalMeetup: this.formBuilder.group({
        minutesOfMeeting: ['']
      }),
      contractual: this.formBuilder.group({
        fileNDA: ['']
      }),
      payment: this.formBuilder.group({
        cardPayment: this.formBuilder.group({
          cardName: [''],
          cardNumber: [''],
          expiryMonth: [''],
          expiryYear: [''],
          autoPay: ['']
        }),
        chequePayment: this.formBuilder.group({
          chequeImageURL: ['']
        }),
        wireTransferPayment: this.formBuilder.group({
          wireTransferImageURL: ['']
        })
      }),
      timeStamps : this.formBuilder.group({
        discoveryTimeStamp: [''],
        technicalMeetupTimeStamp: [''],
        contractualTimeStamp: [''],
        paymentTimeStamp: [''],
        onBoardingTimeStamp: [''],
        nDASentTimeStamp: ['']
      })
    });
    // Initializing Service Form Ends

    // Initializing Customer Form
    this.customerFormData = this.formBuilder.group({
      name: [''],
      email: [''],
      companyName: [''],
      jobTitle: [''],
      phone: [''],
      noEmployees: [''],
      companyDetails: [''],
      country: ['']
    });
    // Initializing Customer Form Ends

    // Pushing Team Members in Discovery
    this.discoveryTeam.controls.forEach((value: any) => {
      const obj = {
        name: 'Haris Ullah Khan',
        title: 'Solution Engineer',
        imageUrl: 'imgURL',
        expanded: 'false',
      };
      value.value.subMembers.push(obj);
    });
    // Pushing Team Members in Discovery Ends

    this.cardPaymentForm = this.formBuilder.group({
      ServicePlan: [''],
      AmountToPay: [''],
      TotalAmount: [''],
      NameOnCard: [''],
      CardNumber: [''],
      ExpiryMonth: ['01'],
      ExpiryYear: ['2023'],
      CVV: [''],
      AutoPayment: [false]
    });
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.listAllServices = []
  }

  get discoveryTeam(): any {
    return this.serviceForm!.get(["discovery"]);
  }

  get subMembersTeam(): any {
    const discoveryGroup = this.serviceForm!.get("discovery") as FormGroup;
    return discoveryGroup.get("subMembers");
  }

  familyMembers: Member[] = [
    {
      name: 'M. Shahjahan Mushtaq',
      title: 'Sales Manager',
      imageUrl: 'https://media.licdn.com/dms/image/C4E03AQFRZrN2FLMjag/profile-displayphoto-shrink_100_100/0/1621504873849?e=1698278400&v=beta&t=eEdrXD6aX7fq3XrpYVQ3e4FP-HUlNnSCaERkCYrAcXU',
      expanded: true,
      subMembers: [
          {
              name: 'Ahad Butt',
              title: 'Full Stack Developer',
              imageUrl: 'https://media.licdn.com/dms/image/C4D03AQHTCVaaC8x6SQ/profile-displayphoto-shrink_100_100/0/1606909492433?e=1698278400&v=beta&t=eA1freA3g4zFLZu1UOL59ZWY1liL1AyMudjkdrMWfPM',
              expanded: true,
              subMembers: [
                  {
                      name: 'Harris Khan',
                      title: 'Solution Engineer',
                      imageUrl: 'https://media.licdn.com/dms/image/D4D03AQHgzFUZZVsrrQ/profile-displayphoto-shrink_200_200/0/1694444758219?e=1705536000&v=beta&t=XA7orKGSDjBMrPc_RJBhy87webTSdp7heYhE5DR-QXw',
                      expanded: false
                  },
                  {
                      name: 'Muhammad Haseeb',
                      title: 'Solution Engineer',
                      imageUrl: 'https://media.licdn.com/dms/image/D4D03AQHhNzqs1SJn0A/profile-displayphoto-shrink_200_200/0/1694513859870?e=1700092800&v=beta&t=1StDAdA18nMRQQSbMXkO-ftmPf2yd81_4h4ugBie1f4',
                      expanded: false
                  }
              ]
          },
          // Add more family members here
      ]
    },
    // Add more family members here
  ];

  // Set User Profile Picture on ImageViewTag
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const profileImage = this.elementRef.nativeElement.querySelector('#imagePreview');

    this.renderer.setProperty(profileImage, 'textContent', '');

    if (input.files && input.files[0]) {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        this.renderer.setStyle(this.elementRef.nativeElement.querySelector('#imagePreview'), 'background-image', `url(${e.target.result})`);
        this.renderer.setStyle(this.elementRef.nativeElement.querySelector('#imagePreview'), 'display', 'none');
        setTimeout(() => {
          this.renderer.setStyle(this.elementRef.nativeElement.querySelector('#imagePreview'), 'display', 'block');
        }, 650);
      };

      reader.readAsDataURL(input.files[0]);
      this.profilePictureEvent = event;
    }
  }
  // Set User Profile Picture on ImageViewTag Ends

  // Set User Profile Picture from S3
  displayProfileImage(image: any) {
    this.profilePictureURL = 'https://ssaugmentationclient191322-dev.s3.us-west-2.amazonaws.com/public/' + image;
    this.profilePicture.setSharedVariable(this.profilePictureURL);
    
    const profileImageElement = this.elementRef.nativeElement.querySelector('#imagePreview');

    this.renderer.setProperty(profileImageElement, 'textContent', '');
    this.renderer.setStyle(profileImageElement, 'background-image', `url(${this.profilePictureURL})`);   
  }
  // Set User Profile Picture from S3 Ends

  // Upload User Profile Picture
  async uploadProfilePictue(event:any) {
    try{
      Storage.put("customer/profile_" + this.customerID.toString() + "/" + this.customerID + '.' + 'webp', event.target.files[0], {
        contentType: event.target.type
      }).then((status) => {
        console.log(status);
      });
    }
    catch(error: any) {
      console.error('Error at uploadFile: ', error)
    }
  }
  // Upload User Profile Picture Ends

  onRemove(event:any) {
    this.files.splice(this.files.indexOf(event), 1);
  }
  
  onSelect(event:any) {
    if(event.addedFiles[0].type != 'application/pdf'){
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-right',
        iconColor: 'white',
        customClass: {
          popup: 'colored-toast'
        },
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      })
      Toast.fire({
        icon: 'info',
        title: 'Please Select only PDF Files!'
      });
    }
    else{
      if(this.files.length >= 1) {
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-right',
          iconColor: 'white',
          customClass: {
            popup: 'colored-toast'
          },
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        })
        Toast.fire({
          icon: 'info',
          title: 'You can only select a single NDA FIle!'
        });
      }
      else {
        this.files.push(...event.addedFiles);
      }
    } 
  }

  onSelectChequeModal(event:any) {
    if(event.addedFiles[0].type != 'image/png' && event.addedFiles[0].type != 'image/jpeg' && event.addedFiles[0].type != 'image/webp'){
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-right',
        iconColor: 'white',
        customClass: {
          popup: 'colored-toast'
        },
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      })
      Toast.fire({
        icon: 'info',
        title: 'Please select only image files!'
      });
    }
    else{
      this.chequePaymentFiles.push(...event.addedFiles);
    } 
  }

  onRemoveChequeModal(event:any) {
    this.chequePaymentFiles.splice(this.chequePaymentFiles.indexOf(event), 1);
  }

  onSelectWireTransferModal(event:any) {
    if(event.addedFiles[0].type != 'image/png' && event.addedFiles[0].type != 'image/jpeg' && event.addedFiles[0].type != 'image/webp'){
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-right',
        iconColor: 'white',
        customClass: {
          popup: 'colored-toast'
        },
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      })
      Toast.fire({
        icon: 'info',
        title: 'Please select only image files!'
      });
    }
    else{
      this.wireTransferPaymentFiles.push(...event.addedFiles);
    } 
  }

  onRemoveWireTransferModal(event:any) {
    this.wireTransferPaymentFiles.splice(this.wireTransferPaymentFiles.indexOf(event), 1);
  }

  // Function to Toggle User Members on Family Tree
  toggleMember(member: Member): void {
    member.expanded = !member.expanded;
  }
  // Function to Toggle User Members on Family Tree Ends

  // Function to create service for customer
  createService() {
    try{
      const todayDate = new Date();
      const userDate = new Date(this.serviceForm.controls['startDate'].value);
      if(this.customerData === undefined) {
        Swal.fire('Profile Update Required', 'To access this feature, please update your profile information.', 'info');

        let showCustomerModal = document.getElementById('launchModal');
        showCustomerModal?.click();
      }
      if(userDate < todayDate) {
        Swal.fire('Selected Date Error!', 'Please select future dates', 'warning');
        return;
      }
      else{
        Swal.fire({
          title: 'Are you sure you want to add this Service Plan?',
          icon: 'info',
          background: 'white',
          showDenyButton: true,
          confirmButtonText: 'Yes',
          confirmButtonColor: '#54c263',
          denyButtonColor: 'grey',
          denyButtonText: `No`,
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire({
              title: 'Adding Service, Please Wait!',
              icon: 'info',
              background: 'white',
              confirmButtonColor: '#54c263',
              allowOutsideClick: false,
              html: '<div class="spinner"></div>',
              didOpen: () => {
                Swal.showLoading();
              }
            });
            const startDate = new Date(this.serviceForm.controls['startDate'].value);
            const planDuration = Number(this.serviceForm.controls['planDuration'].value);
  
            const endDate = new Date(startDate);
            endDate.setMonth(startDate.getMonth() + planDuration);
  
            const formattedEndDate = this.datePipe.transform(endDate, 'yyyy-MM-dd');
            this.serviceForm.controls['endDate'].setValue(formattedEndDate);

            this.planStatusTime = new Date();
            let options = {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            };

            this.planStatusTime = this.planStatusTime.toLocaleString('en-US', options);
            this.serviceForm.get('timeStamps.discoveryTimeStamp')!.setValue(this.planStatusTime);
  
            if(this.serviceForm?.controls['planName'].value === 'Base') {
              this.serviceForm.controls['planAmount'].setValue((Number(this.serviceForm.controls['planDuration'].value) * 3750).toString());
              this.serviceForm.controls['teamMembers'].setValue('3');
              this.serviceForm.get('basic.planStatus')!.setValue('You have been selected for Basic Plan Augmentation');
            }
            else if(this.serviceForm?.controls['planName'].value === 'Business') {
              this.serviceForm.controls['planAmount'].setValue((Number(this.serviceForm.controls['planDuration'].value) * 8400).toString());
              this.serviceForm.controls['teamMembers'].setValue('5');
              this.serviceForm.get('basic.planStatus')!.setValue('You have been selected for Business Plan Augmentation');
            }
            else if(this.serviceForm?.controls['planName'].value === 'Enterprise') {
              this.serviceForm.controls['planAmount'].setValue((Number(this.serviceForm.controls['planDuration'].value) * 13450).toString());
              this.serviceForm.controls['teamMembers'].setValue('7');
              this.serviceForm.get('basic.planStatus')!.setValue('You have been selected for Enterprise Plan Augmentation');
            }
  
            const createServiceDate = async () => {
              // @ts-ignore
              const serviceDate = await API.post('SSClientCRUD', '/items/createService', {
                headers: {
                  'Content-Type': 'application/json', // Set the content type here
                },
                body:{
                  SK: 'service',
                  ServiceData: this.serviceForm?.getRawValue(),
                  ClientID: this.customerID
                },
              });
              if (serviceDate.message == 'Service Created') {
                Swal.close();
      
                Swal.fire({
                  title: 'Service Plan has been added!',
                  icon: 'success',
                  background: 'white',
                  showDenyButton: false,
                  confirmButtonText: 'Ok',
                  confirmButtonColor: '#54c263',
                  allowOutsideClick: false,
                  allowEscapeKey: false
                }).then((result) => {
                  if (result.isConfirmed) {
                    window.location.reload();
                  }
                });
              }
              else {
                Swal.close();
                Swal.fire('Something Went Wrong!!', 'Please try again', 'warning');
              }
            };
            createServiceDate().then((info) => console.log(info));
          }
          else{
            Swal.close();
            Swal.fire('Service Plan not added!', '', 'info');
          }
        });
      }
    }
    catch(error: any){
      Swal.close();
      Swal.fire('Something Went Wrong!!', 'Please try again', 'warning');
    }
  }
  // Function to create service for customer ends

  // Function to list customer
  async listCustomer(){
    try{
       //@ts-ignore
       const response = await API.get("SSClientCRUD", "/items/listCustomer/" + this.customerID);
       this.customerData = response.Items[0];
       if(response.Count != 0) {
        this.profilePicture.setSharedAgent(this.customerData);
        Storage.list('customer/profile_' + this.customerID + '/')
        .then((profileImage) => {
          if(profileImage.results.length != 0) {
            this.displayProfileImage(profileImage.results[0].key);
          }
          else{
            this.profilePicture.setSharedVariable('No Image Found!');
            if(this.customerData.CustomerData.name != undefined){
              const fullName = this.customerData.CustomerData.name;
              const spaceIndex = fullName.indexOf(' ');
    
              let firstName = '';
              let lastName = '';
    
              if (spaceIndex !== -1) {
                firstName = fullName.slice(0, spaceIndex);
                lastName = fullName.slice(spaceIndex + 1);
      
                const initials = firstName.charAt(0) + lastName.charAt(0);
                const profileImage = this.elementRef.nativeElement.querySelector('#imagePreview');
      
                this.renderer.setProperty(profileImage, 'textContent', initials);
              }
              else {
                const initials = this.customerData.CustomerData.name.charAt(0)
                const profileImage = this.elementRef.nativeElement.querySelector('#imagePreview');
      
                this.renderer.setProperty(profileImage, 'textContent', initials);
              }
            }
          }
        });

        this.customerFormData.controls['name'].setValue(this.customerData.CustomerData.name);
        this.customerFormData.controls['companyName'].setValue(this.customerData.CustomerData.companyName);

        this.customerFormData.controls['companyDetails'].setValue(this.customerData.CustomerData.companyDetails);
        this.customerFormData.controls['noEmployees'].setValue(this.customerData.CustomerData.noEmployees);

        this.customerFormData.controls['country'].setValue(this.customerData.CustomerData.country);
        this.customerFormData.controls['jobTitle'].setValue(this.customerData.CustomerData.jobTitle);
       }
       else{
        this.profilePicture.setSharedVariable('No Image Found!');
        this.profilePicture.setSharedAgent('No Customer Data Found!');
        let showCustomerModal = document.getElementById('launchModal');
        showCustomerModal?.click();
       }
    }
    catch(error: any){
      Swal.fire('Something went wrong!', 'Please try again in a few minutes.', 'error');
      console.error('Error at listCustomer: ', error)
    }
  }
  // Function to list customer ends

  // Function to list customer services
  async listServices(){
    try{
      console.log(this.customerID);

      //@ts-ignore
      const response = await API.get("SSClientCRUD", "/items/listServicesClient/" + this.customerID);
      this.listAllServices = response;
    }
    catch(error: any){
      console.error('Error at listServices: ', error)
    }
  }
  // Function to list customer services ends

  // Function to update customer services
  async updateServices(){
    try{
      //@ts-ignore
      API.put("SSClientCRUD", "/items/updateService", {
        body: {
          PK: 'service#3',
          SK: 'service',
          ServiceData: this.serviceForm?.getRawValue(),
          ClientID: this.customerID
        }
      }).then((response) => {
        if(response.message == 'Service Updated'){
          console.log('Service Updated')
        }
        else {
          console.log('Something went wrong while updating Service');
        }
      });
    }
    catch(error: any){
      console.error('Error in updateServices', error)
    }
  }
  // Function to update customer services ends

  // Function to delete customer services
  async deleteService(){
    try {
      //@ts-ignore
      API.post('SSClientCRUD', '/items/deleteService', {
        body: {
          PK: 'service#1',
          SK: 'service'
        }
      }).then((response) => {
        if(response.message == 'Service Deleted'){
          console.log('Service Deleted')
        }
        else {
          console.log('Something went wrong while deleting Service');
        }
      })
    }
    catch(error: any) {
      console.error('Error in deleteService', error)
    }
  }
  // Function to delete customer services ends

  // Fetch customer clicked service based on PK
  getService(service: any) {
    try {
      this.listUserClickService = service;
      this.viewUserServiceData = service;

      this.clickedServicePK = service.PK;
      this.editable = false;

      if(service.ServiceData.discovery.length >= 1) {
        for(let user of service.ServiceData.discovery) {
          this.familyMembers = [user];
        }
      }

      this.showUserClickedService = false;
    }
    catch(error) {
      console.error('Error at getService: ', error);
    }
  }
  // Fetch customer clicked service based on PK ends

  // Edit customer clicked service based on PK
  editUserService(userService: any) {
    try {
      this.editable = !this.editable;
      this.editUserServiceData = userService;
    }
    catch(error) {
      console.error('Error at editUserService: ', error);
    }
  };
  // Edit customer clicked service based on PK ends

  // onValueChange for updating Plan Duration Starts
  updateMonths(event: Event){
    try {
      const selectedValue = (event.target as HTMLSelectElement).value;
      this.editUserServiceData.ServiceData.planDuration = selectedValue;

      if(this.editUserServiceData.ServiceData.planName === 'Base') {
        this.editUserServiceData.ServiceData.planAmount = (Number(selectedValue) * 3750).toString();
      }
      else if(this.editUserServiceData.ServiceData.planName === 'Business') {
        this.editUserServiceData.ServiceData.planAmount = (Number(selectedValue) * 8400).toString();
      }
      else if(this.editUserServiceData.ServiceData.planName === 'Enterprise') {
        this.editUserServiceData.ServiceData.planAmount = (Number(selectedValue) * 13450).toString();
      }
    }
    catch(error) {
      console.error('Error at updateMonths: ', error);
    }
  }
  // onValueChange for updating Plan Duration Ends

  // Update Function to Save Plan Duration Starts
  saveUserService(userService: any) {
    try{
      Swal.fire({
        title: 'Updating Plan Duration, Please Wait!',
        icon: 'info',
        background: 'white',
        confirmButtonColor: '#54c263',
        allowOutsideClick: false,
        html: '<div class="spinner"></div>',
        didOpen: () => {
          Swal.showLoading();
        }
      });
      this.editable = !this.editable;
      //@ts-ignore
      API.put("SSClientCRUD", "/items/updateService", {
        body: {
          PK: userService.PK,
          SK: 'service',
          ServiceData: this.editUserServiceData.ServiceData,
          ClientID: this.customerID
        }
      }).then((response) => {
        if(response.message == 'Service Updated'){
          Swal.close();
          Swal.fire('Plan Successfully Updated!', '', 'success');
        }
        else {
          Swal.close();
          Swal.fire('Something Went Wrong!', 'Please Try again', 'warning');
        }
      });
    }
    catch(error: any){
      console.error('Error in updateServices', error)
      Swal.close();

      Swal.fire('Something Went Wrong!', 'Please Try again', 'warning');
    }
  };
  // Update Function to Save Plan Duration Ends

  // View customer clicked service based on PK
  viewUserService(userService: any) {
    try {
      this.viewUserServiceData = userService;
      this.showUserClickedService = !this.showUserClickedService;

      if(userService.ServiceData.discovery.length >= 1){
        for(let user of userService.ServiceData.discovery){
          this.familyMembers = [user];
        }
      }

      if(userService.ServiceData.planStatus == 'Payment'){
        this.cardPaymentForm.controls['ServicePlan'].setValue(userService.ServiceData.planName);
        this.cardPaymentForm.controls['AmountToPay'].setValue(Number(userService.ServiceData.planAmount)/Number(userService.ServiceData.planDuration));

        this.cardPaymentForm.controls['NameOnCard'].setValue(this.customerData.CustomerData.name);
      }

      setTimeout(() => {
        if (userService.ServiceData.planStatus === 'Contractual') {
          const HTMLcode = userService.ServiceData.contractual.fileNDA;
          const div = this.elementRef.nativeElement.querySelector('#editor-holder');
    
          if (div) {
            this.renderer.setProperty(div, 'innerHTML', HTMLcode);
            const divEditor = this.elementRef.nativeElement.querySelector('#editor');
            this.renderer.setAttribute(divEditor, 'contenteditable', 'false');

            const elementIDs = ['#employeeSignature', '#jobTitleEmployee', '#signDateEmployee'];
            const svgLogo = this.elementRef.nativeElement.querySelectorAll('#logo-size-nda');

            elementIDs.forEach((id: string) => {
              const elements = this.elementRef.nativeElement.querySelectorAll(id);
              elements.forEach((element: HTMLElement) => {
                this.applySignatureStyles(element);
              });
            });
            svgLogo.forEach((svg: HTMLElement) => {
              this.renderer.setStyle(svg, 'height', '60px');
            });
          } else {
            console.error('Element with ID "editor" not found.');
          }
        }
      }, 100); // Adjust the delay as needed

      this.flipClock(userService);
    }
    catch(error) {
      console.error('Error at viewUserService: ', error)
    }
  }
  // View customer clicked service based on PK ends

  // Function to Delete Service Plan Strats
  deleteUserService(userService: any) {
    try{
      Swal.fire({
        title: 'Are you sure you want to delete this Service Plan?',
        icon: 'warning',
        background: 'white',
        showDenyButton: true,
        confirmButtonText: 'Delete',
        confirmButtonColor: 'maroon',
        denyButtonColor: 'grey',
        denyButtonText: `No`,
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: 'Deleting Service, Please Wait!',
            icon: 'info',
            background: 'white',
            confirmButtonColor: '#54c263',
            allowOutsideClick: false,
            html: '<div class="spinner"></div>',
            didOpen: () => {
              Swal.showLoading();
            }
          });
          //@ts-ignore
          API.post('SSClientCRUD', '/items/deleteService', {
            body: {
              PK: userService.PK,
              SK: 'service'
            }
          }).then((response) => {
            if(response.message == 'Service Deleted'){
              Swal.close();
              window.location.reload();
            }
            else {
              Swal.close();
              console.log('Something went wrong while deleting Service');
            }
          })
        }
        else{
          Swal.close();
          Swal.fire('Service Not Deleted!', '', 'info');
        }
      });
    }
    catch(error: any) {
      Swal.close();
      Swal.fire('Something Went Wrong!', 'Please Try again', 'warning');
      
      console.error('Error at deleteUserService: ', error);
    }

  }
  // Function to Delete Service Plan Ends

  // Function to submit customer data
  submitCustomerData() {
    try{
      Swal.fire({
        title: 'Updating Profile, Please Wait!',
        icon: 'info',
        background: 'white',
        confirmButtonColor: '#54c263',
        allowOutsideClick: false,
        html: '<div class="spinner"></div>',
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const createCustomerData = async () => {
        // @ts-ignore
        const customerData = await API.post('SSClientCRUD', '/items/createCustomer', {
          headers: {
            'Content-Type': 'application/json', // Set the content type here
          },
          body:{
            PK: 'customer#' + this.customerID,
            SK: 'customer',
            CustomerData: this.customerFormData.getRawValue(),
            ClientID: this.customerID
          },
        });
        if (customerData.message == 'Customer Created') {
          console.log('Customer has been created');
          Swal.close();

          Swal.fire({
            title: 'Profile Updated!',
            icon: 'success',
            background: 'white',
            showDenyButton: false,
            confirmButtonText: 'Ok',
            confirmButtonColor: '#54c263',
            allowOutsideClick: false,
            allowEscapeKey: false
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.reload();
            }
          });
        }
      };
      if(this.profilePictureEvent === undefined) {
        createCustomerData().then((info) => console.log(info));
      }
      else{
        this.uploadProfilePictue(this.profilePictureEvent).then(() => {
          createCustomerData().then((info) => console.log(info));
        });
      }
    }
    catch(error: any){
      console.error('Error in submitCustomerData: ', error);
      Swal.close();
      
      Swal.fire('Something Went Wrong!', 'Please Try again', 'warning');
    }
  }
  // Function to submit customer data ends

  // Swal Alert for Plan Starts
  selectPlanFirst(){
    if(this.serviceForm.controls['planName'].value === ''){
      Swal.fire('Please Select a Plan First!', '', 'warning');
    }
  }
  // Swal Alert for Plan Ends

  // Download NDA for User
  async downloadNDA(service: any) {
    try {
      Swal.fire({
        title: 'Downloading NDA File, Please Wait!',
        icon: 'info',
        background: 'white',
        confirmButtonColor: '#54c263',
        allowOutsideClick: false,
        html: '<div class="spinner"></div>',
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const servicePK = service.PK.split('#').join('');
      Storage.list('customer/NDA/NDA_' + service.ClientID + servicePK).then((NDAFile) => {
        if(NDAFile.results.length != 0) {
          const baseURL = 'https://ssaugmentationclient191322-dev.s3.us-west-2.amazonaws.com/public/';
          const nDAFileDownloadLink = baseURL + NDAFile.results[0].key;
          
          this.http.get(nDAFileDownloadLink, { responseType: 'blob', observe: 'response' }).subscribe(
            (response) => {
              const contentDisposition = response.headers.get('content-disposition');
              let filename = 'NDA-File.pdf';
      
              if (contentDisposition) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(contentDisposition);
                if (matches && matches[1]) {
                  filename = matches[1].replace(/['"]/g, '');
                }
              }
              saveAs(response.body as Blob, filename);
              Swal.close();

              Swal.fire('NDA File Downloaded!', '', 'success');
            },
            (error) => {
              console.error('Error downloading PDF:', error);

              Swal.close();
              Swal.fire('Something Went Wrong!', 'Please Try again', 'warning');
            }
          );
        }
        else {
          Swal.close();
          Swal.fire('Something Went Wrong!', 'Please Try again', 'warning');
        }
      });
    }
    catch(error: any) {
      console.error('Error at downloadNDA: ', error);
      Swal.close();

      Swal.fire('Something Went Wrong!', 'Please Try again', 'warning');
    }
  }
  // Download NDA for User Ends

  // Upload Signed NDA
  uploadNDA(service: any) {
    try{
      if(this.files.length <= 0){
        Swal.fire('Please select a File First!', '', 'info');
      }
      else {
        Swal.fire({
          title: 'Are you sure you want to submit this NDA File?',
          icon: 'info',
          background: 'white',
          showDenyButton: true,
          confirmButtonText: 'Yes',
          confirmButtonColor: '#54c263',
          denyButtonColor: 'grey',
          denyButtonText: `No`,
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire({
              title: 'Submitting NDA file, Please Wait!',
              icon: 'info',
              background: 'white',
              confirmButtonColor: '#54c263',
              allowOutsideClick: false,
              html: '<div class="spinner"></div>',
              didOpen: () => {
                Swal.showLoading();
              }
            });

            this.files.forEach((file: any) => {
              Storage.put("customer/profile_" + this.customerID.toString() + "/" + 'NDA/' +  'NDA_' + this.customerID.toString() + '.pdf' , file, {
                contentType: file.type
              }).then((status) => {
                service.ServiceData.planStatus = 'Payment';
                service.ServiceData.contractual.fileNDA = 'NDA_' + this.customerID.toString() + '.pdf';

                const apiUrl = 'https://hm7k64lh1d.execute-api.us-west-2.amazonaws.com/dev/items/updateService';
                const requestBody = {
                  PK: service.PK,
                  SK: 'service',
                  ServiceData: service.ServiceData,
                  ClientID: this.customerID
                };
                // Send the PUT request to the API
                this.http.put(apiUrl, requestBody).subscribe(
                  (response: any) => {
                    if(response.message === "Service Updated"){
                      Swal.close();
                      Swal.fire({
                        title: 'NDA File Successfully Uploaded!',
                        icon: 'success',
                        background: 'white',
                        showDenyButton: false,
                        confirmButtonText: 'Ok',
                        confirmButtonColor: '#54c263',
                        allowOutsideClick: false,
                        allowEscapeKey: false
                      }).then((result) => {
                        if (result.isConfirmed) {
                          window.location.reload();
                        }
                      });
                    }
                  },
                  (error: any) => {
                    // Handle any errors here
                    console.error('PUT request error', error);
                    Swal.close();
                    Swal.fire('Something Went Wrong!', 'Please Try again', 'error');
                  }
                );
              });
            });
          }
          else {
            Swal.close();
            Swal.fire('NDA File not submitted!', '', 'info');
          }
        });
      }
    }
    catch (error: any) {
      console.error('Error at sendNDA: ', error);
      Swal.fire('Something went wrong!', 'Please try again', 'error');
    }
  }
  // Upload Signed NDA Ends

  // Generate PDF code starts
  signNDA() {
    try {
      Swal.fire({
        title: 'Are you sure you want to Sign this NDA?',
        icon: 'info',
        background: 'white',
        showDenyButton: true,
        confirmButtonText: 'Yes',
        confirmButtonColor: '#54c263',
        denyButtonColor: 'grey',
        denyButtonText: `No`,
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then((result) => {
        if(result.isConfirmed){
          Swal.fire({
            title: 'Signing NDA, Please Wait!',
            icon: 'info',
            background: 'white',
            confirmButtonColor: '#54c263',
            allowOutsideClick: false,
            html: '<div class="spinner"></div>',
            didOpen: () => {
              Swal.showLoading();
            }
          });

          // Extract the HTML content from the variable
          const htmlContent = this.viewUserServiceData.ServiceData.contractual.fileNDA;

          // Create a temporary element to manipulate the content
          const tempElement = document.createElement('text-editor');
          tempElement.innerHTML = htmlContent;

          let latestDate = new Date();
          const month = latestDate.toLocaleString('en-US', { month: 'short' });

          const day = latestDate.getDate();
          const year = latestDate.getFullYear();

          // Find and update the content of the <p> tags by their IDs
          const employeeSignatureValue = this.customerFormData.controls['name'].value;
          const jobTitleEmployeeValue = this.customerFormData.controls['jobTitle'].value;
          const signDateEmployeeValue = `${month} ${day}, ${year}`;

          const employeeSignatureElement = tempElement.querySelector('#employeeSignature');
          const jobTitleEmployeeElement = tempElement.querySelector('#jobTitleEmployee');
          const signDateEmployeeElement = tempElement.querySelector('#signDateEmployee');

          if (employeeSignatureElement) {
            employeeSignatureElement.textContent = employeeSignatureValue;
          }

          if (jobTitleEmployeeElement) {
            jobTitleEmployeeElement.textContent = jobTitleEmployeeValue;
          }

          if (signDateEmployeeElement) {
            signDateEmployeeElement.textContent = signDateEmployeeValue;
          }

          this.planStatusTime = new Date();
          let options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          };

          this.planStatusTime = this.planStatusTime.toLocaleString('en-US', options);
          this.viewUserServiceData.ServiceData.timeStamps.nDASentTimeStamp = this.planStatusTime;

          // Update the HTML content in the variable
          this.viewUserServiceData.ServiceData.contractual.fileNDA = tempElement.innerHTML;
          const servicePK = this.viewUserServiceData.PK.split('#').join('');

          if(this.viewUserServiceData.ServiceData.contractual.fileNDA) {
            API.post("SSClientCRUD", "/items/generatePDF", {
              body: {
                html: this.viewUserServiceData.ServiceData.contractual.fileNDA,
                key: `NDA_${this.customerID}${servicePK}.pdf`,
                tempkey: `public/customer/NDA/NDA_${this.customerID}${servicePK}.pdf`
              }
            }).then((response) => {
              if(response.message === 'Created'){
                this.viewUserServiceData.ServiceData.planStatus = 'Payment';

                //@ts-ignore
                API.put("SSClientCRUD", "/items/updateService", {
                  body: {
                    PK: this.viewUserServiceData.PK,
                    SK: 'service',
                    ServiceData: this.viewUserServiceData.ServiceData,
                    ClientID: this.customerID
                  }
                }).then((response) => {
                  if(response.message == 'Service Updated'){
                    Swal.close();
                    Swal.fire({
                      title: 'NDA File Successfully Signed!',
                      icon: 'success',
                      background: 'white',
                      showDenyButton: false,
                      confirmButtonText: 'Ok',
                      confirmButtonColor: '#54c263',
                      allowOutsideClick: false,
                      allowEscapeKey: false
                    }).then((result) => {
                      if (result.isConfirmed) {
                        window.location.reload();
                      }
                    });
                  }
                  else {
                    console.log('Something went wrong while updating Service');
                  }
                });
              }
              else {
                Swal.fire('Something went wrong!', 'Please try again.', 'error');
              }
            });
          }
        }
        else {
          Swal.close();
          Swal.fire('NDA not Signed!', '', 'info');
        }
      })
    }
    catch(error) {
      Swal.close();
      Swal.fire('Something went wrong!', 'Please try again.', 'error');
    }
  }
  // Generate PDF code Ends

  // Upload Cheque Images Starts
  uploadChequeImages() {
    try{
      if(this.chequePaymentFiles.length <= 0) {
        Swal.fire('Please select a File First!', '', 'info');
      }
      else {
        Swal.fire({
          title: 'Are you sure you want to submit these images?',
          icon: 'info',
          background: 'white',
          showDenyButton: true,
          confirmButtonText: 'Yes',
          confirmButtonColor: '#54c263',
          denyButtonColor: 'grey',
          denyButtonText: `No`,
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then(async (result) => {
          if(result.isConfirmed) {
            Swal.fire({
              title: 'Submitting Cheque Images, Please Wait!',
              icon: 'info',
              background: 'white',
              confirmButtonColor: '#54c263',
              allowOutsideClick: false,
              html: '<div class="spinner"></div>',
              didOpen: () => {
                Swal.showLoading();
              }
            });

            const servicePK = this.viewUserServiceData.PK.split('#').join('');
            const uploadPromises = this.chequePaymentFiles.map(async (file: any, index: number) => {
              await Storage.put("customer/Payment/" + 'Cheque/' + 'Cheque_' + this.customerID.toString() + servicePK + "/" + index.toString() + '.webp', file, {
                contentType: file.type
              });
            });

            try {
              this.planStatusTime = new Date();
              let options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              };

              this.planStatusTime = this.planStatusTime.toLocaleString('en-US', options);
              await Promise.all(uploadPromises);

              this.viewUserServiceData.ServiceData.planStatus = 'Payment Pending';
              this.viewUserServiceData.ServiceData.timeStamps.paymentTimeStamp = this.planStatusTime;

              //@ts-ignore
              API.put("SSClientCRUD", "/items/updateService", {
                body: {
                  PK: this.viewUserServiceData.PK,
                  SK: 'service',
                  ServiceData: this.viewUserServiceData.ServiceData,
                  ClientID: this.customerID
                }
              }).then((response) => {
                if(response.message == 'Service Updated'){
                  Swal.close();
                  Swal.fire({
                    title: 'Cheque Images Uploaded Successfully!',
                    icon: 'success',
                    background: 'white',
                    showDenyButton: false,
                    confirmButtonText: 'Ok',
                    confirmButtonColor: '#54c263',
                    allowOutsideClick: false,
                    allowEscapeKey: false
                  }).then((result) => {
                    if (result.isConfirmed) {
                      window.location.reload();
                    }
                  });
                }
                else {
                  Swal.close();
                  Swal.fire('Something went wrong!', 'Please try again', 'error');
                }
              });
            }
            catch (error) {
              Swal.close();
              Swal.fire('Something went wrong!', 'Please try again', 'error');
            }
          }
          else {
            Swal.close();
            Swal.fire('Cheque Images not uploaded!', '', 'info');
          }
        })
      }
    }
    catch(error) {
      console.log('Error at uploadChequeImages: ', error)
      Swal.fire('Something Went Wrong!', 'Please try again.', 'error');
    }
  }
  // Upload Cheque Images Ends

  // Upload Cheque Images Starts
  uploadWireTransferImages() {
    try{
      if(this.wireTransferPaymentFiles.length <= 0) {
        Swal.fire('Please select a File First!', '', 'info');
      }
      else {
        Swal.fire({
          title: 'Are you sure you want to submit these images?',
          icon: 'info',
          background: 'white',
          showDenyButton: true,
          confirmButtonText: 'Yes',
          confirmButtonColor: '#54c263',
          denyButtonColor: 'grey',
          denyButtonText: `No`,
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then(async (result) => {
          if(result.isConfirmed) {
            Swal.fire({
              title: 'Submitting Wire Transfer Images, Please Wait!',
              icon: 'info',
              background: 'white',
              confirmButtonColor: '#54c263',
              allowOutsideClick: false,
              html: '<div class="spinner"></div>',
              didOpen: () => {
                Swal.showLoading();
              }
            });

            const servicePK = this.viewUserServiceData.PK.split('#').join('');
            const uploadPromises = this.wireTransferPaymentFiles.map(async (file: any, index: number) => {
              await Storage.put("customer/Payment/" + 'WireTransfer/' + 'WireTransfer_' + this.customerID.toString() + servicePK + "/" + index.toString() + '.webp', file, {
                contentType: file.type
              });
            });

            try {
              this.planStatusTime = new Date();
              let options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              };

              this.planStatusTime = this.planStatusTime.toLocaleString('en-US', options);
              await Promise.all(uploadPromises);

              this.viewUserServiceData.ServiceData.planStatus = 'Payment Pending';
              this.viewUserServiceData.ServiceData.timeStamps.paymentTimeStamp = this.planStatusTime;

              //@ts-ignore
              API.put("SSClientCRUD", "/items/updateService", {
                body: {
                  PK: this.viewUserServiceData.PK,
                  SK: 'service',
                  ServiceData: this.viewUserServiceData.ServiceData,
                  ClientID: this.customerID
                }
              }).then((response) => {
                if(response.message == 'Service Updated'){
                  Swal.close();
                  Swal.fire({
                    title: 'Wire Transfer Images Uploaded Successfully!',
                    icon: 'success',
                    background: 'white',
                    showDenyButton: false,
                    confirmButtonText: 'Ok',
                    confirmButtonColor: '#54c263',
                    allowOutsideClick: false,
                    allowEscapeKey: false
                  }).then((result) => {
                    if (result.isConfirmed) {
                      window.location.reload();
                    }
                  });
                }
                else {
                  Swal.close();
                  Swal.fire('Something went wrong!', 'Please try again', 'error');
                }
              });
            }
            catch (error) {
              Swal.close();
              Swal.fire('Something went wrong!', 'Please try again', 'error');
            }
          }
          else {
            Swal.close();
            Swal.fire('Wire Transfer Images not uploaded!', '', 'info');
          }
        })
      }
    }
    catch(error) {
      console.log('Error at uploadWireTransferImages: ', error)
      Swal.fire('Something Went Wrong!', 'Please try again.', 'error');
    }
  }
  // Upload Cheque Images Ends

  downloadCheqeueRecipts(service: any) {
    try{
      Swal.fire({
        title: 'Do you want to View your Cheque Recipt?',
        icon: 'info',
        background: 'white',
        showDenyButton: true,
        confirmButtonText: 'Yes',
        confirmButtonColor: '#54c263',
        denyButtonColor: 'grey',
        denyButtonText: `No`,
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then((result) => {
        if(result.isConfirmed) {
          Swal.fire({
            title: 'Opening Recipt, Please Wait!',
            icon: 'info',
            background: 'white',
            confirmButtonColor: '#54c263',
            allowOutsideClick: false,
            html: '<div class="spinner"></div>',
            didOpen: () => {
              Swal.showLoading();
            }
          });

          const servicePK = service.PK.split('#').join('');
          const filePath = `customer/Payment/Cheque/Cheque_${this.customerID.toString()}${servicePK}`;

          Storage.list(filePath + '/')
          .then((chequeImages) => {
            if(chequeImages.results.length > 0) {
              chequeImages.results.forEach((image) => {
                this.downloadSingleAttachment(image.key);
              });
              Swal.close();
            }
          });
        }
        else {
          Swal.close();
          Swal.fire('Action Cancelled!', '', 'info');
        }
      })
    }
    catch(error) {
      Swal.close();
      Swal.fire('Something went wrong!', 'Please try again', 'info');

      console.error('Error at downloadCheqeueRecipts: ', error);
    }
  }

  downloadWireTransferRecipts(service: any) {
    try{
      Swal.fire({
        title: 'Do you want to View your Wire Transfer Recipt?',
        icon: 'info',
        background: 'white',
        showDenyButton: true,
        confirmButtonText: 'Yes',
        confirmButtonColor: '#54c263',
        denyButtonColor: 'grey',
        denyButtonText: `No`,
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then((result) => {
        if(result.isConfirmed) {
          Swal.fire({
            title: 'Opening Recipt, Please Wait!',
            icon: 'info',
            background: 'white',
            confirmButtonColor: '#54c263',
            allowOutsideClick: false,
            html: '<div class="spinner"></div>',
            didOpen: () => {
              Swal.showLoading();
            }
          });

          const servicePK = service.PK.split('#').join('');
          const filePath = `customer/Payment/WireTransfer/WireTransfer_${this.customerID.toString()}${servicePK}`;

          Storage.list(filePath + '/')
          .then((wireTransferImages) => {
            if(wireTransferImages.results.length > 0) {
              wireTransferImages.results.forEach((image) => {
                this.downloadSingleAttachment(image.key);
              });
              Swal.close();
            }
          });
        }
        else {
          Swal.close();
          Swal.fire('Action Cancelled!', '', 'info');
        }
      })
    }
    catch(error) {
      Swal.close();
      Swal.fire('Something went wrong!', 'Please try again', 'info');

      console.error('Error at downloadWireTransferRecipts: ', error);
    }
  }

  // Check Signle Attachment Starts
  async downloadSingleAttachment(key:any) {
    try{
      const signedURL = `https://ssaugmentationclient191322-dev.s3.us-west-2.amazonaws.com/public/${key}`
      this.downloadBlob(signedURL, key);
    }
    catch(error){
      console.error('Error at downloadSingleAttachment: ', error);
    }
  }
  // Check Signle Attachment Ends

  // Open Signle Attachment in new Tab Starts
  downloadBlob(blob: any, filename: any) {
    const a = document.createElement('a');
    a.href = blob;
    a.target = '_blank';
    a.download = filename || 'download';
    const clickHandler = () => {
      setTimeout(() => {
        a.removeEventListener('click', clickHandler);
      }, 150);
    };
    a.addEventListener('click', clickHandler, false);
    a.click();
    return a;
  }
  // Open Signle Attachment in new Tab Ends

  applySignatureStyles(element: HTMLElement) {
    try {
      this.renderer.setStyle(element, 'borderRadius', '0px');
      this.renderer.setStyle(element, 'borderTop', 'none');
      this.renderer.setStyle(element, 'borderLeft', 'none');
      this.renderer.setStyle(element, 'borderRight', 'none');
      this.renderer.setStyle(element, 'borderBottom', '1px solid black');
      this.renderer.setStyle(element, 'fontFamily', "'Cedarville Cursive', cursive");
      this.renderer.setStyle(element, 'fontStyle', 'italic');
      this.renderer.setStyle(element, 'padding', '0');
    }
    catch(error: any) {
      console.error('Error at: applySignatureStyles', error);
    }
  }

  flipClock(service: any) {
    const second = 1000,
    minute = second * 60,
    hour = minute * 60,
    day = hour * 24;
    this.showEnd = false

    const countDown = new Date(service.ServiceData.endDate).getTime();
    const x = setInterval(() => {
      const now = new Date().getTime();
      const distance = countDown - now;

      this.days = Math.floor(distance / day);
      this.hours = Math.floor((distance % day) / hour);
      this.minutes = Math.floor((distance % hour) / minute);
      this.seconds = Math.floor((distance % minute) / second);

      if (distance < 0) {
        this.showEnd = true;
        clearInterval(x);
      }
    }, 0);
  }

}
