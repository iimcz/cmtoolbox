import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddVideoPackageComponent } from './add-video-package.component';

describe('AddVideoPackageComponent', () => {
  let component: AddVideoPackageComponent;
  let fixture: ComponentFixture<AddVideoPackageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddVideoPackageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddVideoPackageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
