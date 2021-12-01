import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-script-setup-dialog',
  templateUrl: './script-setup-dialog.component.html',
  styleUrls: ['./script-setup-dialog.component.css']
})
export class ScriptSetupDialogComponent implements OnInit {
  settingsDataSource = new MatTableDataSource(TEST_SETTINGS);

  constructor() { }

  ngOnInit(): void {
  }
}

const TEST_SETTINGS: ScriptSetting[] = [
  { key: 'test1', value: '1' },
  { key: 'test2', value: 'hodnota' }
];

export interface ScriptSetting {
  key: string;
  value: string;
}
