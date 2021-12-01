import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddGalleryPackageComponent } from './add-gallery-package.component';

describe('AddGalleryPackageComponent', () => {
  let component: AddGalleryPackageComponent;
  let fixture: ComponentFixture<AddGalleryPackageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddGalleryPackageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddGalleryPackageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
