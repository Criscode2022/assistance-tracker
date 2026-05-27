import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LanguageService } from './services/language.service';
import { ThemeService } from './services/theme.service';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    TranslateModule.forRoot({
      defaultLanguage: 'es',
    }),
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    LanguageService,
    ...provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(_lang: LanguageService, _theme: ThemeService) {}
}
