import { TestBed } from '@angular/core/testing';

import { ListServicesServiceService } from './list-services-service.service';

describe('ListServicesServiceService', () => {
  let service: ListServicesServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ListServicesServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
