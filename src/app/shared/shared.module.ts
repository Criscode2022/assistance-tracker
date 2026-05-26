import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { OnlineIndicatorComponent } from './online-indicator.component';

@NgModule({
  declarations: [OnlineIndicatorComponent],
  imports: [CommonModule, IonicModule],
  exports: [OnlineIndicatorComponent],
})
export class SharedModule {}
