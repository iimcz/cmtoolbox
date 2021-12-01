import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { ScriptSetupDialogComponent } from 'src/app/dialogs/script-setup-dialog/script-setup-dialog.component';

@Component({
  selector: 'app-add-scripts',
  templateUrl: './add-scripts.component.html',
  styleUrls: ['./add-scripts.component.css']
})
export class AddScriptsComponent implements OnInit {
  scriptDataSource = new MatTableDataSource(TEST_SCRIPTS);

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
  }

  addScript() {

    this.scriptDataSource.data.push(
      {id: 1, name: 'script', description: 'popis', settings: []}
    )
    this.scriptDataSource.data = this.scriptDataSource.data.slice();
  }

  openSettings(script: ScriptItem) {
    this.openScriptSetupDialog(script.id);
  }

  deleteScript(script: ScriptItem) {
    this.scriptDataSource.data = this.scriptDataSource.data.filter((sc) => sc !== script);
  }

  openScriptSetupDialog(scriptId: number) {
    const dialogRef = this.dialog.open(ScriptSetupDialogComponent, {
      data: {
        scriptId: scriptId
      }
    });

    //dialogRef.afterClosed().subscribe((result) => {});
  }
}

const TEST_SCRIPTS: ScriptItem[] = [

];

export interface ScriptSetting {
  key: string;
  value: string;
}

export interface ScriptItem {
  id: number;
  name: string;
  description: string;

  settings: ScriptSetting[];
}