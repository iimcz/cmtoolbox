import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
// import { OrbitControls } from '@three-ts/orbit-controls'; TODO: resolve optimization bailout
import { map, mergeWith, Observable, Subject, switchMap } from 'rxjs';
import { AddMetadataComponent } from 'src/app/add-common-steps/add-metadata/add-metadata.component';
import { FileClient } from 'src/app/services/api';
import { DataFile, PackagesClient, PresentationPackage } from 'src/app/services/api.generated.service';

import * as THREE from 'three';

@Component({
  selector: 'app-add-model-package',
  templateUrl: './add-model-package.component.html',
  styleUrls: ['./add-model-package.component.css']
})
export class AddModelPackageComponent implements OnInit, AfterViewInit {
  @ViewChild(AddMetadataComponent) addMetadataComponent!: AddMetadataComponent;
  @ViewChildren('preview3d') canvasList!: QueryList<ElementRef<HTMLCanvasElement>>;
  canvas!: HTMLCanvasElement;

  unfinishedPackage$!: Observable<PresentationPackage>;

  notifyPackageUpdate$: Subject<number> = new Subject();
  notifyRouteUpdate$!: Observable<number>;

  modelCustomControls = new MatTableDataSource<CustomControl>();

  modelSettings: ModelSettings = {
    backgroundColor: '#7CFF00',
    basicControls: 'grab-drag'
  }

  // three.js
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, 400 / 200);
  //controls!: OrbitControls;
  renderer!: THREE.WebGLRenderer;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private packagesClient: PackagesClient,
    private fileClient: FileClient
  ) { }

  ngOnInit(): void {
    this.notifyRouteUpdate$ = this.route.paramMap.pipe(
      map((params: ParamMap) => parseInt(params.get('id')!))
    );
    this.unfinishedPackage$ = this.notifyRouteUpdate$.pipe(
      mergeWith(this.notifyPackageUpdate$),
      switchMap((id: number) => this.packagesClient.getUnfinishedPackage(id))
    );
    this.unfinishedPackage$.subscribe((pkg) => {
      this.refresh3DScene(pkg.dataFiles!);
    });
  }

  ngAfterViewInit() {
    this.camera.position.z = 3;
    this.scene.background = new THREE.Color(0, 255, 0);
    this.scene.add(this.camera);

    this.canvasList.changes.subscribe((cv: QueryList<ElementRef<HTMLCanvasElement>>) => {
      this.canvas = cv.first.nativeElement;
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas
      });
      this.renderer.setSize(this.canvas.width, this.canvas.height);
      //this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      //this.controls.enablePan = false;
      this.renderPreview();
    });
  }

  renderPreview() {
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.renderPreview.bind(this));
  }

  finishAddingPackage(id: number) {
    this.packagesClient.finishPackage(id).subscribe(
      (pkg) => {
        this.router.navigate(['/package', pkg.id]);
      }
    );
  }

  addCustomControl() {
    this.modelCustomControls.data.push({action: '', eventParams: '', eventType: ''});
    this.modelCustomControls.data = this.modelCustomControls.data.slice();
  }

  removeCustomControl(control: CustomControl) {
    this.modelCustomControls.data = this.modelCustomControls.data.filter((el) => el !== control);
  }

  goBack() {
    history.back();
  }

  triggerSaveMetadata() {
    this.addMetadataComponent.saveAllData();
  }

  refreshPackage(id: number) {
    this.notifyPackageUpdate$.next(id);
  }

  refresh3DScene(file: DataFile[]) {
    //this.scene.remove
  }
}

export interface CustomControl {
  action: string;
  eventType: string;
  eventParams: string;
}

export interface ModelSettings {
  basicControls: string;
  backgroundColor: string;
}