import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExhibitClient } from 'src/app/services/api.generated.service';
import { EventSocketService, EventType } from 'src/app/services/event-socket.service';

@Component({
  selector: 'app-exhibit-upload-dialog',
  templateUrl: './exhibit-upload-dialog.component.html',
  styleUrls: ['./exhibit-upload-dialog.component.css']
})
export class ExhibitUploadDialogComponent implements OnInit {
  public pendingDevices: string[] = [];
  public acceptedDevices: string[] = [];


  constructor(
    @Inject(MAT_DIALOG_DATA) private data: { package_id: number },
    private exhibitClient: ExhibitClient,
    private eventSocket: EventSocketService
  ) {
    this.updateDeviceLists();
    this.eventSocket.subscribeEvent(EventType.ConnectionsUpdated).subscribe();
  }

  ngOnInit(): void {
  }

  updateDeviceLists(): void {
    this.exhibitClient.getPendingConnections()
      .subscribe(
        data => this.pendingDevices = data
      );
    this.exhibitClient.getEstablishedConnections()
      .subscribe(
        data => this.acceptedDevices = data
      );
  }

  acceptConnection(connid: string) {
    this.exhibitClient.acceptConnection(connid)
      .subscribe(
        // do nothing
      );
  }

  sendPackage(connid: string) {
    this.exhibitClient.sendPackage(connid, this.data.package_id)
      .subscribe(
        // do nothing
      );
  }

}
