export interface ICustomer {
    ClientID: string;
    PK: string;
    SK: string;
    CustomerData: IClientData;
}

interface IClientData {
    name: string;
    email: string;
    companyName: string;
    jobTitle: string;
    phone: string;
    noEmployees: string;
    companyDetails: string;
    country: string;
}