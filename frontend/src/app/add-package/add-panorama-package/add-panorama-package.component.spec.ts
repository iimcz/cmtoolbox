import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPanoramaPackageComponent } from './add-panorama-package.component';

describe('AddPanoramaPackageComponent', () => {
  let component: AddPanoramaPackageComponent;
  let fixture: ComponentFixture<AddPanoramaPackageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddPanoramaPackageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddPanoramaPackageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
