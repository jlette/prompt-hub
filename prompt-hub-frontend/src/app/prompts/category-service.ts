import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { environment } from '../../environments/environment.development'
import { Category } from './category.model'

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  httpclient = inject(HttpClient)
  baseUrl = environment.apiUrl + 'categories'
  getCategories () {
    return this.httpclient.get<Category[]>(this.baseUrl)
  }
}
