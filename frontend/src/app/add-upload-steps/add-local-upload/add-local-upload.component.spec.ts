import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddLocalUploadComponent } from './add-local-upload.component';

describe('AddLocalUploadComponent', () => {
  let component: AddLocalUploadComponent;
  let fixture: ComponentFixture<AddLocalUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddLocalUploadComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddLocalUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
