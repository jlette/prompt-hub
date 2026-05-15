import { inject, Injectable } from '@angular/core'
import { Prompt } from './prompt.model'
import { HttpClient } from '@angular/common/http'
import { environment } from '../../environments/environment.development'
import { delay } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class PromptService {
  httpclient = inject(HttpClient)
  baseUrl = environment.apiUrl + 'prompts'
  getPrompts() {
    return this.httpclient.get<Prompt[]>(this.baseUrl).pipe(delay(3000))
  }
  getPrompt(promptId:number) {
    return this.httpclient.get<Prompt>(`${this.baseUrl}/${promptId}`).pipe(delay(3000))
  }
  createPrompt(prompt:{title:string; content:string; categoryId:number}) {
    return this.httpclient.post<Prompt[]>(this.baseUrl, prompt).pipe(delay(3000))
  }

  updatePrompt(promptId:number,prompt:{title:string; content:string; categoryId:number}) {
    return this.httpclient.put<Prompt>(`${this.baseUrl}/${promptId}`, prompt).pipe(delay(3000))
  }

  deletePrompt(promptId:number) {
    return this.httpclient.delete<Prompt>(`${this.baseUrl}/${promptId}`).pipe(delay(3000))
  }

  upvotePrompt(promptId:number) {
    return this.httpclient
      .post<Prompt>(`${this.baseUrl}/${promptId}/upvote`, null)
      .pipe(delay(3000))
  }
  downvotePrompt(promptId:number) {
    return this.httpclient
      .post<Prompt>(`${this.baseUrl}/${promptId}/downvote`, null)
      .pipe(delay(3000))
  }
}
