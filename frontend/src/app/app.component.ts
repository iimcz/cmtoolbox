import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PackagesClient } from './services/api.generated.service';

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
    // this.packagesClient.createNewPackage()
    //   .subscribe(
    //     (resp) => {
          
    //   }
    // )
    this.router.navigate(["add-package", "gallery"]);
  }

  addPackageModel()
  {
    this.router.navigate(["add-package", "model"]);
  }

  addPackageVideo()
  {
    this.router.navigate(["add-package", "video"]);
  }

  addPackageScene()
  {
    this.router.navigate(["add-package", "scene"]);
  }
}
