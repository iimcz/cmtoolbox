import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
// import { OrbitControls } from '@three-ts/orbit-controls'; TODO: resolve optimization bailout
import { map, mergeWith, Observable, Subject, switchMap } from 'rxjs';
import { AddMetadataComponent } from 'src/app/add-common-steps/add-metadata/add-metadata.component';
import { FlagInteraction } from 'src/app/interfaces/package-descriptor.generated';
import { FileClient } from 'src/app/services/api';
import { DataFile, PackagesClient, PresentationPackage, Settings as ApiSettings, Parameters as ApiParameters, FlagInteraction as ApiFlagInteraction, CameraAnimation, ModelCameraTarget, Vector3, Action, TypeEnum, Mapping, Transform } from 'src/app/services/api.generated.service';

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

  settingsFG = this.fb.group({
    skyboxTint: ['#000000', { initialValueIsDefault: true }],
    cameraDistance: [0.5, { initialValueIsDefault: true }],
    cameraHeight: [0.5, { initialValueIsDefault: true }],
    cameraRevolutionTime: [10, { initialValueIsDefault: true }],
    flagInteraction: ['swipe', { initialValueIsDefault: true }]
  });

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
    private fileClient: FileClient,
    private fb: FormBuilder
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

  saveParametersAndInputs(id: number, filename: string) {
    let inputs: Action[] = []; // TODO: fill

    let settings = new ApiSettings();
    settings.skybox = undefined;
    settings.skyboxTint = this.settingsFG.get('skyboxTint')?.value;
    settings.fileName = filename.substring(filename.lastIndexOf('/') + 1, filename.lastIndexOf('.')) + '.glb';

    settings.cameraAnimation = new CameraAnimation();
    // TODO: These should be settable through the preview
    settings.cameraAnimation.lookAt = new ModelCameraTarget({ objectName: '', offset: new Vector3({ x: 0, y: 0, z: 0 }) });
    settings.cameraAnimation.origin = new ModelCameraTarget({ objectName: '', offset: new Vector3({ x: 0, y: 0, z: -1 }) });

    settings.cameraAnimation.distance = this.settingsFG.get('cameraDistance')?.value;
    settings.cameraAnimation.height = this.settingsFG.get('cameraHeight')?.value;
    settings.cameraAnimation.revolutionTime = this.settingsFG.get('cameraRevolutionTime')?.value;

    settings.flagInteraction = this.mapFlagInteraction(this.settingsFG.get('flagInteraction')?.value);
    settings.flags = [];
    
    let params = new ApiParameters({ displayType: 'model', settings: settings });

    this.packagesClient.setPackageParameters(id, params).subscribe();
    this.packagesClient.setPackageInputs(id, [
      // TODO: use API-provided per-package-type and per-exhibit-type inputs here
      new Action({
        effect: 'cursor_position',
        type: TypeEnum.Complex,
        mapping: new Mapping({
          source: 'mediapipe/handtracking/hand/left/center_position'
        })
      }),
      new Action({
        effect: 'cursor_position',
        type: TypeEnum.Complex,
        mapping: new Mapping({
          source: 'mediapipe/handtracking/hand/right/center_position'
        })
      }),new Action({
        effect: 'cursor_position',
        type: TypeEnum.Complex,
        mapping: new Mapping({
          source: 'nuitrack/handtracking/user/0/hand/left/center_position'
        })
      }),
      new Action({
        effect: 'cursor_position',
        type: TypeEnum.Complex,
        mapping: new Mapping({
          source: 'nuitrack/handtracking/user/0/hand/right/center_position'
        })
      }),
      
      new Action({
        effect: 'mode',
        type: TypeEnum.String,
        mapping: new Mapping({
          source: 'mediapipe/handtracking/hand/left/gestures/pinch',
          transform: new Transform({
            type: 'constant',
            value: 'Zoom'
          })
        })
      }),
      new Action({
        effect: 'mode',
        type: TypeEnum.String,
        mapping: new Mapping({
          source: 'mediapipe/handtracking/hand/left/gestures/close_hand',
          transform: new Transform({
            type: 'constant',
            value: 'Rotate'
          })
        }),
      }),
      new Action({
        effect: 'mode',
        type: TypeEnum.String,
        mapping: new Mapping({
          source: 'mediapipe/handtracking/hand/left/gestures/open_hand',
          transform: new Transform({
            type: 'constant',
            value: 'None'
          })
        })
      }),
      new Action({
        effect: 'mode',
        type: TypeEnum.String,
        mapping: new Mapping({
          source: 'mediapipe/handtracking/hand/right/gestures/pinch',
          transform: new Transform({
            type: 'constant',
            value: 'Zoom'
          })
        })
      }),
      new Action({
        effect: 'mode',
        type: TypeEnum.String,
        mapping: new Mapping({
          source: 'mediapipe/handtracking/hand/right/gestures/close_hand',
          transform: new Transform({
            type: 'constant',
            value: 'Rotate'
          })
        }),
      }),
      new Action({
        effect: 'mode',
        type: TypeEnum.String,
        mapping: new Mapping({
          source: 'mediapipe/handtracking/hand/right/gestures/open_hand',
          transform: new Transform({
            type: 'constant',
            value: 'None'
          })
        })
      })
    ]).subscribe();
  }

  refreshPackage(id: number) {
    this.notifyPackageUpdate$.next(id);
  }

  refresh3DScene(file: DataFile[]) {
    //this.scene.remove
  }

  mapFlagInteraction(flagInt: FlagInteraction): ApiFlagInteraction {
    switch (flagInt) {
      case FlagInteraction.Point:
        return ApiFlagInteraction.Point;
      case FlagInteraction.Swipe:
        return ApiFlagInteraction.Swipe;
    }
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