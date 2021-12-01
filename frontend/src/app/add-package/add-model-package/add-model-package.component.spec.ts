import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddModelPackageComponent } from './add-model-package.component';

describe('AddModelPackageComponent', () => {
  let component: AddModelPackageComponent;
  let fixture: ComponentFixture<AddModelPackageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddModelPackageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddModelPackageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
