import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { OnlineIndicatorComponent } from './online-indicator.component';

@NgModule({
  declarations: [OnlineIndicatorComponent],
  imports: [CommonModule, IonicModule, TranslateModule],
  exports: [OnlineIndicatorComponent, TranslateModule],
})
export class SharedModule {}
