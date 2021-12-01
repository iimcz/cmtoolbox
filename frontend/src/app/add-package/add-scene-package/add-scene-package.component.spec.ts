import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddScenePackageComponent } from './add-scene-package.component';

describe('AddScenePackageComponent', () => {
  let component: AddScenePackageComponent;
  let fixture: ComponentFixture<AddScenePackageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddScenePackageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddScenePackageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
