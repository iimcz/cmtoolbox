import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-scene-package',
  templateUrl: './add-scene-package.component.html',
  styleUrls: ['./add-scene-package.component.css']
})
export class AddScenePackageComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
    
  }


  finishAddingPackage() {
    this.router.navigate(['/packages']);
  }

  goBack() {
    history.back();
  }
}
