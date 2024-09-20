export interface IService {
    ClientID: string;
    PK: string;
    SK: string;
    ServiceData: IServiceData;
}

interface IServiceData {
    basic: IBasicData;
    contractual: IContractualData;
    discovery: IDiscoveryData;
    payment: IPaymentData;
    endDate: string;
    startDate: string;
    planAmount: string;
    planDuration: string;
    planStatus: string;
    planName: string;
    teamMembers: string;
    technicalMeetup: ITechnicalData;
    timeStamps: ITimeStamps;
}

interface ITimeStamps {
    discoveryTimeStamp: string;
    technicalMeetupTimeStamp: string;
    contractualTimeStamp: string;
    paymentTimeStamp: string;
    onBoardingTimeStamp: string;
    nDASentTimeStamp: string;
}

interface IBasicData {
    planStatus: string;
}

interface IContractualData {
    fileNDA: string;
}

interface IDiscoveryData {
    expanded: string;
    imageUrl: string;
    name: string;
    title: string;
    submembers: IDiscoveryData;
}

interface IPaymentData {
    cardPayment: ICardPayment;
    chequePayment: IChequePayment;
    wireTransferPayment: IWirePayment;
}

interface ICardPayment {
    autopay: string;
    cardName: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
}

interface IChequePayment {
    chequeImageURL: string;
}

interface IWirePayment {
    wireTransferImageURL: string;
}

interface ITechnicalData {
    minutesOfMeeting: string[];
}