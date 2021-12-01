import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PackagesClient, PackageType } from './services/api.generated.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'frontend';

  constructor(
    private router: Router,
    private packagesClient: PackagesClient
  ) {}

  navigateUserProfile()
  {
    // TODO: current user id
    this.router.navigate(['/user', {id: 0}]);
  }

  addPackageImage()
  {
    this.packagesClient.createNewPackage(PackageType.Gallery).subscribe(pkg => {
      this.router.navigate(["add-package", "gallery", pkg.id]);
    });
  }

  addPackageModel()
  {
    this.packagesClient.createNewPackage(PackageType.Model).subscribe(pkg => {
      this.router.navigate(["add-package", "model", pkg.id]);
    });
  }

  addPackageVideo()
  {
    this.packagesClient.createNewPackage(PackageType.Video).subscribe(pkg => {
      this.router.navigate(["add-package", "video", pkg.id]);
    });
  }

  addPackageScene()
  {
    this.packagesClient.createNewPackage(PackageType.Scene).subscribe(pkg => {
      this.router.navigate(["add-package", "scene", pkg.id]);
    });
  }
}
