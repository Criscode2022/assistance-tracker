import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { OnlineIndicatorComponent } from './online-indicator.component';
import { EmptyCoursesComponent } from './empty-courses.component';

@NgModule({
  declarations: [OnlineIndicatorComponent, EmptyCoursesComponent],
  imports: [CommonModule, IonicModule, TranslateModule],
  exports: [OnlineIndicatorComponent, EmptyCoursesComponent, TranslateModule],
})
export class SharedModule {}
