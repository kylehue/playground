import templates, { Template } from "../templates";
import { nanoid } from "nanoid";

const storageKeys = {
   projects: "projects"
};

export function getProjects() {
   let raw = localStorage.getItem(storageKeys.projects);
   let result: Template[] = [...templates];
   if (raw) {
      let parsed = JSON.parse(raw);
      result = parsed;
   }

   return result;
}

export function addProject(project: Omit<Template, "id" | "lastEdited">) {
   let projects = getProjects();

   let newProject: Template = {
      id: nanoid(),
      name: project.name || "",
      lastEdited: Date.now(),
      files: project.files || [],
      packages: project.packages || []
   };

   projects.push(newProject);

   localStorage.setItem(storageKeys.projects, JSON.stringify(projects));

   return newProject;
}

export function removeProjectById(projectId: string) {
   let projects = getProjects();

   for (let i = 0; i < projects.length; i++) {
      let project = projects[i];
      if (project.id === projectId) {
         projects.splice(i, 1);
         localStorage.setItem(storageKeys.projects, JSON.stringify(projects))
         return project;
      }
   }

   return null;
}

export function updateProject(projectId: string, newProject: Omit<Template, "id" | "lastEdited">) {
   let projects = getProjects();

   for (let i = 0; i < projects.length; i++) {
      let project = projects[i];
      if (project.id === projectId) {
         project = Object.assign(project, newProject);
         project.lastEdited = Date.now();

         localStorage.setItem(storageKeys.projects, JSON.stringify(projects));
         return project;
      }
   }
}