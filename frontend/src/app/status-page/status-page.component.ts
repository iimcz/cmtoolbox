import { Component, OnInit } from '@angular/core';
import { ConfigurationClient } from '../services/api.generated.service';

@Component({
  selector: 'app-status-page',
  templateUrl: './status-page.component.html',
  styleUrls: ['./status-page.component.css']
})
export class StatusPageComponent implements OnInit {
  public toolList: ToolConfig[] = [];

  constructor(
    private configClient: ConfigurationClient
  ) { }

  ngOnInit(): void {
    this.configClient.getConfiguration().subscribe((cfg) => {
      this.toolList = [
        { toolName: 'ffmpeg', settings: [
          { name: 'path', type: 'string', value: cfg.ffmpegPath ?? 'System default' }
        ]
        },
        {
          toolName: 'imagemagick', settings: [
          { name: 'path', type: 'string', value: cfg.imageMagickPath ?? 'System default' }
        ]}
      ]
    });
  }

}

export class ToolConfig {
  toolName: string = "";
  settings: ToolSetting[] = [];
}

export class ToolSetting {
  name: string = "";
  type: string = "";
  value: any;
}