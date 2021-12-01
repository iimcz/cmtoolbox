import { BaseCdkCell } from '@angular/cdk/table';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-video-package',
  templateUrl: './add-video-package.component.html',
  styleUrls: ['./add-video-package.component.css']
})
export class AddVideoPackageComponent implements OnInit {
  previewUrl: string = "";
  advancedConversionSettings: boolean = false;

  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  goBack(): void {
    history.back();
  }

  finishAddingPackage() {
    this.router.navigate(['/packages']);
  }

  applySimpleConversionParams() {

  }

  applyAdvancedConversionParams() {
    
  }
}
