import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExhibitUploadDialogComponent } from './exhibit-upload-dialog.component';

describe('ExhibitUploadDialogComponent', () => {
  let component: ExhibitUploadDialogComponent;
  let fixture: ComponentFixture<ExhibitUploadDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExhibitUploadDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExhibitUploadDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
