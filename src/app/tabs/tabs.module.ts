import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TabsPage } from './tabs.page';
import { TabsRoutingModule } from './tabs-routing.module';

@NgModule({
  declarations: [TabsPage],
  imports: [CommonModule, IonicModule, TabsRoutingModule],
})
export class TabsModule {}
