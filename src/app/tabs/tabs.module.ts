import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TabsPage } from './tabs.page';
import { TabsRoutingModule } from './tabs-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [TabsPage],
  imports: [CommonModule, IonicModule, TabsRoutingModule, SharedModule],
})
export class TabsModule {}
