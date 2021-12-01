import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMultiresPackageComponent } from './add-multires-package.component';

describe('AddMultiresPackageComponent', () => {
  let component: AddMultiresPackageComponent;
  let fixture: ComponentFixture<AddMultiresPackageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddMultiresPackageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMultiresPackageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
