import { Injectable } from '@angular/core';
import { IService } from 'src/interfaces/iservice';
import { API, Auth } from 'aws-amplify';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ListServicesServiceService {
  listAllServices: IService[] = [];
  filterUserService: Subject<IService[]> = new Subject<IService[]>();
  
  customerID: any;

  constructor() {
    const getCurrentUser = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        this.customerID = user.attributes.sub;
      } catch (err) {
        console.log('No current user:', err);
      }
    };

    getCurrentUser().then(() => {
      this.listServices();
    });
  }

  async listServices(){
    try{
      //@ts-ignore
      const response = await API.get("SSClientCRUD", "/items/listServicesClient/" + this.customerID);
      this.listAllServices = response.Items;
      this.filterUserService.next(this.listAllServices);
    }
    catch(error: any){
      console.error('Error at listServices: ', error)
    }
  }
}
