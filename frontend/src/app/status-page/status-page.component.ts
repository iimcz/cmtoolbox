import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-status-page',
  templateUrl: './status-page.component.html',
  styleUrls: ['./status-page.component.css']
})
export class StatusPageComponent implements OnInit {
  public toolList = TEST_TOOLS;

  constructor() { }

  ngOnInit(): void {
  }

}

const TEST_TOOLS: ToolConfig[] = [
  { toolName: 'ffmpeg', settings: [
    { name: 'path', type: 'string', value: '/usr/bin/' },
    { name: 'shouldBatch', type: 'bool', value: true },
    { name: 'fallbackBitrate', type: 'number', value: 5000 },
  ]},
]

export class ToolConfig {
  toolName: string = "";
  settings: ToolSetting[] = [];
}

export class ToolSetting {
  name: string = "";
  type: string = "";
  value: any;
}